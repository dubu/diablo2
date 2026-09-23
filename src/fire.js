/** 원본 화염 시트와 캐시된 대체 효과. 전투 난수를 사용하지 않습니다. */
import { FIRE_RANGE, FIRE_DURATION } from './engine.js';

const TAU = Math.PI * 2;
const noise = n => {
    const value = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return value - Math.floor(value);
};

// 작은 화염 텍스처 8장과 지면광을 한 번만 생성합니다. 매 프레임 블러를 계산하지 않습니다.
let textures;
let originalFlames;
let loading;
export function loadFire() {
    if (loading) return loading;
    const base = new URL('../public/assets/sprites/', import.meta.url);
    loading = (async () => {
        const response = await fetch(new URL('fire.json', base), { signal: AbortSignal.timeout(15000) });
        if (!response.ok) throw new Error('화염 목록 로딩 실패');
        const specs = await response.json();
        const loaded = await Promise.all(specs.map(async spec => {
            const image = new Image();
            image.src = new URL(spec.file, base).href;
            await new Promise((resolve, reject) => {
                const timer = setTimeout(() => reject(new Error('화염 로딩 시간 초과')), 15000);
                image.decode().then(() => { clearTimeout(timer); resolve(); }, error => { clearTimeout(timer); reject(error); });
            });
            if (image.naturalWidth !== spec.width * spec.frames || image.naturalHeight !== spec.height) {
                throw new Error('화염 시트 크기 오류');
            }
            return { ...spec, image };
        }));
        originalFlames = loaded;
        return true;
    })().catch(() => false);
    return loading;
}
export function prepareFire() {
    if (textures) return;
    const flames = Array.from({ length: 8 }, (_, frame) => {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 96;
        const ctx = canvas.getContext('2d');
        const lean = Math.sin(frame / 8 * TAU) * 12;
        const gradient = ctx.createLinearGradient(0, 80, 0, 12);
        gradient.addColorStop(0, 'rgba(255,90,10,0)');
        gradient.addColorStop(0.15, 'rgba(255,210,95,0.85)');
        gradient.addColorStop(0.3, 'rgba(255,105,12,0.75)');
        gradient.addColorStop(0.7, 'rgba(230,38,3,0.5)');
        gradient.addColorStop(1, 'rgba(140,15,0,0)');
        ctx.fillStyle = gradient;
        ctx.shadowColor = 'rgba(255,85,8,0.6)';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.moveTo(16, 80);
        ctx.bezierCurveTo(16, 48, 32 + lean, 46, 32 + lean, 12);
        ctx.bezierCurveTo(38, 42, 48, 63, 48, 80);
        ctx.closePath();
        ctx.fill();
        return canvas;
    });
    const glow = document.createElement('canvas');
    glow.width = glow.height = 128;
    const ctx = glow.getContext('2d');
    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255,170,55,0.22)');
    gradient.addColorStop(0.65, 'rgba(255,65,8,0.3)');
    gradient.addColorStop(1, 'rgba(130,15,0,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    textures = { flames, glow };
}

export function drawFire(ctx, effect, project, scale, foreground) {
    prepareFire();
    const age = Math.max(0, FIRE_DURATION - effect.life);
    const progress = Math.min(1, age / FIRE_DURATION);
    const fade = Math.min(1, age / 0.035) * Math.pow(1 - progress, 0.65);
    const radius = FIRE_RANGE * (1 - Math.pow(1 - Math.min(1, age / 0.32), 3));
    const center = project(effect.x, effect.y);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // 지면의 빛은 배우 뒤에 그려 캐릭터 실루엣을 보존합니다.
    if (!foreground) {
        const size = (radius * Math.SQRT2 * 32 + 35) * scale;
        ctx.globalAlpha = fade;
        ctx.drawImage(textures.glow, center.x - size, center.y - size * 0.5, size * 2, size);
    }

    // 같은 월드 반경을 등각 투영해 실제 공격 범위와 일치시킵니다.
    const count = originalFlames ? 36 : 56;
    for (let i = 0; i < count; i++) {
        const angle = i / count * TAU;
        const front = Math.cos(angle) + Math.sin(angle) >= 0;
        if (front !== foreground) continue;
        const jitter = 0.86 + noise(i) * 0.14;
        const point = project(effect.x + Math.cos(angle) * radius * jitter,
            effect.y + Math.sin(angle) * radius * jitter);
        const flicker = 0.8 + Math.sin(age * 35 + i * 2.7) * 0.2;
        const height = (23 + noise(i + 91) * 33) * scale * flicker * (1 - progress * 0.6);
        const width = (9 + noise(i + 4) * 7) * scale;
        ctx.globalAlpha = fade;
        if (originalFlames) {
            const spec = originalFlames[i % originalFlames.length];
            const frame = (Math.floor(age * 25) + i * 7) % spec.frames;
            const h = height * 1.65, w = h * spec.width / spec.height;
            ctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(spec.image, frame * spec.width, 0, spec.width, spec.height,
                point.x - w / 2, point.y - h, w, h);
        } else {
            const frame = (Math.floor(age * 24) + i * 3) % textures.flames.length;
            ctx.drawImage(textures.flames[frame], point.x - width * 2,
                point.y - height * 80 / 68, width * 4, height * 96 / 68);
        }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'lighter';

    // 불티는 각 입자의 고정된 위상으로 이동하므로 정지 중에도 흔들리지 않습니다.
    for (let i = 0; i < 44; i++) {
        const angle = noise(i + 700) * TAU;
        if ((Math.cos(angle) + Math.sin(angle) >= 0) !== foreground) continue;
        const distance = radius * (0.35 + noise(i + 80) * 0.65);
        const point = project(effect.x + Math.cos(angle) * distance,
            effect.y + Math.sin(angle) * distance);
        const lift = age * (30 + noise(i + 60) * 90) * scale;
        ctx.strokeStyle = `rgba(255,${160 + Math.floor(noise(i) * 90)},65,${fade})`;
        ctx.lineWidth = (1 + noise(i + 30)) * scale;
        ctx.beginPath();
        ctx.moveTo(point.x, point.y - lift);
        ctx.lineTo(point.x - Math.cos(angle) * 3 * scale, point.y - lift + 5 * scale);
        ctx.stroke();
    }
    ctx.restore();
}
