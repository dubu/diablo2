/** 출처가 기록된 로컬 이미지 시트를 읽고 방향별 애니메이션을 그립니다. */
export const spriteAssets = {
    ready: false,
    error: null,
    actors: {},
    floor: null,
};

const ASSET_BASE_URL = new URL('../public/assets/sprites/', import.meta.url);

function loadImage(url) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        const timer = setTimeout(() => reject(new Error('에셋 로딩 시간 초과')), 15000);
        image.onload = () => { clearTimeout(timer); resolve(image); };
        image.onerror = () => { clearTimeout(timer); reject(new Error(`에셋 로딩 실패: ${url.pathname}`)); };
        image.src = url.href;
    });
}

async function loadActorAnimations(name, animations) {
    const entries = await Promise.all(
        Object.entries(animations).map(async ([action, spec]) => {
            const image = await loadImage(new URL(spec.file, ASSET_BASE_URL));
            return [action, { ...spec, image }];
        }),
    );
    spriteAssets.actors[name] = Object.fromEntries(entries);
}

/** 모든 캐릭터와 바닥 이미지가 준비된 뒤에만 원본 렌더링을 활성화합니다. */
export async function loadSprites() {
    try {
        const response = await fetch(new URL('manifest.json', ASSET_BASE_URL), { signal: AbortSignal.timeout(15000) });
        if (!response.ok) throw new Error('스프라이트 목록을 불러오지 못했습니다.');
        const manifest = await response.json();

        await Promise.all(
            Object.entries(manifest).map(([name, animations]) =>
                loadActorAnimations(name, animations),
            ),
        );
        spriteAssets.floor = await loadImage(new URL('monastery.png', ASSET_BASE_URL));
        spriteAssets.ready = true;
    } catch (error) {
        // 호출자는 오류를 HUD에 표시하고 임시 도형 렌더링을 유지합니다.
        spriteAssets.error = error.message;
    }
    return spriteAssets;
}

/** 화면 아래쪽을 기준으로 시계 방향 각도를 원본 시트의 방향 행에 매핑합니다. */
export function directionRow(name, angle, directions) {
    const fullTurn = Math.PI * 2;
    const turn = ((angle - Math.PI / 2 + fullTurn) % fullTurn) / fullTurn;
    const index = Math.round(turn * directions) % directions;

    // 원본 시트마다 방향 행의 순서가 다릅니다.
    if (name === 'barbarian') return index;
    if (name === 'smith') return [4, 0, 5, 1, 6, 2, 7, 3][index];
    return (index + 7) % 8;
}

/** 시트에서 현재 프레임을 잘라 발 위치(anchor)를 화면 좌표에 맞춥니다. */
export function drawSprite(ctx, name, pose, x, y, scale, time, angle) {
    const animations = spriteAssets.actors[name];
    if (!animations) return false;

    const spec = animations[pose] || animations.idle;
    const row = directionRow(name, angle, spec.directions);
    const framesPerSecond = pose === 'attack' ? 22 : 10;
    const frame = pose === 'death'
        ? spec.frames - 1
        : Math.floor(time * framesPerSecond) % spec.frames;

    ctx.drawImage(
        spec.image,
        frame * spec.width,
        row * spec.height,
        spec.width,
        spec.height,
        x - spec.anchorX * scale,
        y - spec.anchorY * scale,
        spec.width * scale,
        spec.height * scale,
    );
    return true;
}
