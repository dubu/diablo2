import { spriteAssets, loadSprites, drawSprite } from './sprites.js';
import { drawFire, prepareFire, loadFire } from './fire.js';
import { createGame, step, action, collect, random } from './engine.js';

// DOM 참조와 그리기 컨텍스트입니다. 게임 규칙은 engine.js가 담당합니다.
const $ = id => document.getElementById(id);
const canvas = $('game');
const ctx = canvas.getContext('2d');
prepareFire();
let gameReady = false;
let state = createGame();
let paused = false;
let target = null;
const keys = new Set();
let width = 0;
let height = 0;
let scale = 1;
const facing = new Map();
const positions = new Map();
const rng = random(42), decor = Array.from({length: 230}, () => ({x: rng() * 18, y: rng() * 18, v: rng()}));
$('loadingRetry').onclick = () => location.reload();
Promise.all([loadSprites(), loadFire()]).then(([assets, fireReady]) => {
    if (!assets.ready) {
        $('loadingTitle').textContent = '에셋을 불러오지 못했습니다';
        $('loadingText').textContent = '연결을 확인한 뒤 다시 시도해주세요.';
        $('loadingRetry').hidden = false;
        $('assetStatus').textContent = '에셋 로딩 실패';
        return;
    }
    gameReady = true;
    keys.clear();
    last = performance.now();
    render();
    $('loadingScreen').hidden = true;
    $('assetStatus').textContent = 'DIABLO II 원본 스프라이트 적용';
    if (!fireReady) $('toast').textContent = '화염 에셋 로딩 실패 · 기본 효과 사용';
});

function resize() {
    const r = canvas.getBoundingClientRect();
    width = r.width;
    height = r.height;
    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    scale = Math.max(1.05, Math.min(width / 1120, height / 570) * 1.05);
}

new ResizeObserver(resize).observe(canvas);

/** 월드 좌표를 플레이어 중심의 등각 화면 좌표로 변환합니다. */
function project(x, y) {
    return {
        x: width * 0.49 + (x - y - state.player.x + state.player.y) * 32 * scale,
        y: height * 0.53 + (x + y - state.player.x - state.player.y) * 16 * scale
    };
}

function poly(points, fill, stroke) {
    ctx.beginPath();
    points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
        ctx.strokeStyle = stroke;
        ctx.stroke();
    }
}

function ellipse(x, y, rx, ry, color) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
}

function line(points, color, w = 1) {
    ctx.beginPath();
    points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.stroke();
    ctx.lineWidth = 1;
}

function block(x, y, h = 36) {
    const p = project(x, y), w = 20 * scale, d = 10 * scale;
    h *= scale;
    poly([[p.x - w, p.y], [p.x, p.y + d], [p.x, p.y + d - h], [p.x - w, p.y - h]], '#34382d', '#424637');
    poly([[p.x, p.y + d], [p.x + w, p.y], [p.x + w, p.y - h], [p.x, p.y + d - h]], '#252b23', '#3a4031');
    poly([[p.x - w, p.y - h], [p.x, p.y - d - h], [p.x + w, p.y - h], [p.x, p.y + d - h]], '#535443', '#61604b');
    for (let i = 12; i < h; i += 12 * scale) line([[p.x - w, p.y - i], [p.x, p.y + d - i], [p.x + w, p.y - i]], '#171e19');
}

function torch(x, y) {
    const p = project(x, y);
    const g = ctx.createRadialGradient(p.x, p.y - 25, 2, p.x, p.y - 25, 85 * scale);
    g.addColorStop(0, '#e999373c');
    g.addColorStop(1, '#f9800000');
    ctx.fillStyle = g;
    ctx.fillRect(p.x - 90, p.y - 115, 180, 180);
    line([[p.x, p.y], [p.x, p.y - 25 * scale]], '#65563b', 5 * scale);
    ellipse(p.x, p.y - 30 * scale, 4 * scale, (9 + Math.sin(state.time * 8)) * scale, '#e89036');
    ellipse(p.x, p.y - 30 * scale, 2 * scale, 5 * scale, '#ffe8a1');
}

/** 원본 에셋의 방향과 대기/이동/공격 프레임을 선택합니다. */
function originalActor(entity, hero) {
    const name = hero ? 'barbarian' : entity.type, point = project(entity.x, entity.y), id = hero ? 'player' : entity.id;
    const previous = positions.get(id) || entity, dx = entity.x - previous.x, dy = entity.y - previous.y, moving = Math.hypot(dx, dy) > 0.00001;
    let angle = facing.get(id) || Math.PI / 2;
    if (moving) angle = Math.atan2((dx + dy) * 0.5, dx - dy);
    else if (!hero && entity.hp > 0) angle = Math.atan2((state.player.x - entity.x + state.player.y - entity.y) * 0.5, state.player.x - entity.x - state.player.y + entity.y);
    facing.set(id, angle);
    positions.set(id, {x: entity.x, y: entity.y});
    const attacking = hero ? entity.cooldown > 0 : entity.cooldown > 0.9;
    const pose = entity.hp <= 0 ? 'death' : attacking ? 'attack' : moving ? 'walk' : 'idle';
    ellipse(point.x, point.y, hero ? 15 * scale : 19 * scale, 7 * scale, '#0007');
    if (hero) {
        ctx.strokeStyle = '#ad965c';
        ctx.beginPath();
        ctx.ellipse(point.x, point.y, 18 * scale, 8 * scale, 0, 0, Math.PI * 2);
        ctx.stroke();
    }
    ctx.save();
    if (entity.hp <= 0 && !spriteAssets.actors[name].death) {
        ctx.globalAlpha = 0.45;
        ctx.translate(point.x, point.y);
        ctx.scale(1, 0.28);
        drawSprite(ctx, name, 'idle', 0, 0, scale * 0.9, state.time, angle);
    } else drawSprite(ctx, name, pose, point.x, point.y, scale * (name === 'smith' ? 1.15 : 0.9), state.time, angle);
    ctx.restore();
    if (!hero && entity.hp > 0) {
        const top = point.y - (name === 'smith' ? 117 : 86) * scale;
        ctx.fillStyle = '#0b0706';
        ctx.fillRect(point.x - 20 * scale, top, 40 * scale, 4);
        ctx.fillStyle = '#a62920';
        ctx.fillRect(point.x - 20 * scale, top, 40 * scale * entity.hp / entity.maxHp, 3);
        if (name === 'smith') {
            ctx.fillStyle = '#d2b078';
            ctx.font = '11px Georgia';
            ctx.textAlign = 'center';
            ctx.fillText('타락한 대장장이', point.x, top - 8);
        }
    }
}

/** 원본 시트가 준비되지 않았다면 임시 도형으로 표시합니다. */
function actor(entity, hero = false) {
    if (spriteAssets.ready) {
        originalActor(entity, hero);
        return;
    }
    const point = project(entity.x, entity.y), actorScale = scale * (entity.type === 'smith' ? 1.5 : 1), bob = Math.sin(state.time * 5 + entity.x) * actorScale;
    ctx.save();
    ctx.translate(point.x, point.y);
    ellipse(0, 1, 13 * actorScale, 6 * actorScale, '#0007');
    if (entity.hp <= 0) {
        line([[-10 * actorScale, 0], [8 * actorScale, -4 * actorScale]], '#554c3c', 5 * actorScale);
        ctx.restore();
        return;
    }
    if (hero) {
        ellipse(0, 0, 16 * actorScale, 8 * actorScale, '#c3b57722');
        ctx.strokeStyle = '#aa955b';
        ctx.beginPath();
        ctx.ellipse(0, 0, 16 * actorScale, 8 * actorScale, 0, 0, 7);
        ctx.stroke();
    }
    const armor = hero ? '#8c9690' : entity.type === 'skeleton' ? '#b9ad8c' : entity.type === 'smith' ? '#665c4a' : '#934e36';
    line([[-4 * actorScale, -12 * actorScale], [-7 * actorScale, 0], [-11 * actorScale, 1]], '#34382e', 5 * actorScale);
    line([[4 * actorScale, -12 * actorScale], [7 * actorScale, 0], [11 * actorScale, 1]], '#43483b', 5 * actorScale);
    poly([[-8 * actorScale, -29 * actorScale + bob], [6 * actorScale, -29 * actorScale + bob], [10 * actorScale, -12 * actorScale], [-8 * actorScale, -11 * actorScale]], armor, '#252a22');
    if (hero) poly([[-8 * actorScale, -27 * actorScale], [-14 * actorScale, -6 * actorScale], [0, -10 * actorScale]], '#5d3330');
    ellipse(0, -35 * actorScale + bob, 5 * actorScale, 7 * actorScale, hero ? '#a59e85' : armor);
    line([[-3 * actorScale, -35 * actorScale], [3 * actorScale, -35 * actorScale]], '#191f19', 2 * actorScale);
    line([[7 * actorScale, -25 * actorScale], [14 * actorScale, -18 * actorScale], [22 * actorScale, -37 * actorScale]], hero ? '#c1c6b4' : '#8f856c', 3 * actorScale);
    line([[-7 * actorScale, -25 * actorScale], [-14 * actorScale, -15 * actorScale]], armor, 4 * actorScale);
    if (!hero) {
        ctx.fillStyle = '#100e0a';
        ctx.fillRect(-15 * actorScale, -49 * actorScale, 30 * actorScale, 3 * actorScale);
        ctx.fillStyle = '#9c4839';
        ctx.fillRect(-15 * actorScale, -49 * actorScale, 30 * actorScale * entity.hp / entity.maxHp, 3 * actorScale);
        if (entity.type === 'smith') {
            ctx.fillStyle = '#bb9e68';
            ctx.font = '10px Georgia';
            ctx.textAlign = 'center';
            ctx.fillText('타락한 대장장이', 0, -57 * actorScale);
        }
    }
    ctx.restore();
}

function drawGround() {
    for (let x = 0; x < 18; x++) for (let y = 0; y < 18; y++) {
        const p = project(x, y), variant = (x * 31 + y * 17) % 7 === 0 ? 1 : 0;
        if (spriteAssets.ready) {
            ctx.drawImage(spriteAssets.floor, variant * 160, 0, 160, 79, p.x - 32 * scale, p.y - 16 * scale, 64 * scale + 0.5, 32 * scale + 0.5);
        } else poly([[p.x, p.y - 16 * scale], [p.x + 32 * scale, p.y], [p.x, p.y + 16 * scale], [p.x - 32 * scale, p.y]], '#383b2e', '#262b22');
    }
}

function drawScenery() {
    for (let i = 1; i < 18; i++) {
        block(i, 0, 24 + (i % 3) * 9);
        block(0, i, 24 + (i % 4) * 7);
    }
    for (const [x, y] of [[4, 4], [4, 13], [13, 4], [13, 13], [2, 7], [7, 2]]) {
        block(x, y, 60);
        block(x + 0.04, y + 0.04, 66);
    }
    for (const [x, y] of [[4, 4], [13, 13], [2, 7], [7, 2]]) torch(x, y);
}

function drawLoot() {
    for (const l of state.loot) {
        const p = project(l.x, l.y);
        ellipse(p.x, p.y, 6 * scale, 3 * scale, '#c4a044');
        ctx.fillStyle = '#ceb679';
        ctx.font = '10px Georgia';
        ctx.textAlign = 'center';
        ctx.fillText(l.item || `${l.gold} 금화`, p.x, p.y - 10);
    }
}

function drawActors() {
    [...state.enemies, {
        ...state.player,
        hero: true
    }].sort((a, b) => (a.x + a.y) - (b.x + b.y)).forEach(e => actor(e, e.hero));
}

function drawEffects() {
    for (const e of state.effects) {
        if (e.type === 'fire') {
            drawFire(ctx, e, project, scale, true);
            continue;
        }
        const p = project(e.x, e.y), r = (1 - e.life / 0.4) * 70 * scale + 15;
        ctx.strokeStyle = e.type === 'hurt' ? '#c03636' : '#ede4b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(p.x, p.y - 10 * scale, r, r * 0.5, 0, 0, 7);
        ctx.stroke();
        ctx.lineWidth = 1;
    }
}

function drawDestination() {
    if (target) {
        const p = project(target.x, target.y);
        line([[p.x - 6, p.y], [p.x, p.y - 4], [p.x + 6, p.y], [p.x, p.y + 4], [p.x - 6, p.y]], '#b4a778');
    }
}

function drawVignette() {
    const vignette = ctx.createRadialGradient(width / 2, height / 2, height * 0.2, width / 2, height / 2, width * 0.65);
    vignette.addColorStop(0, '#04090700');
    vignette.addColorStop(1, '#040907db');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
}

/** 바닥 → 배경 구조물 → 전리품 → 캐릭터 → 효과 → HUD 순서입니다. */
function render() {
    if (!gameReady) return;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#171e18';
    ctx.fillRect(0, 0, width, height);
    drawGround();
    drawScenery();
    drawLoot();
    for (const effect of state.effects) {
        if (effect.type === 'fire') drawFire(ctx, effect, project, scale, false);
    }
    drawActors();
    drawEffects();
    drawDestination();
    drawVignette();
    updateUI();
}

function updateUI() {
    const p = state.player;
    $('health').textContent = `${Math.ceil(p.hp)} / ${p.maxHp}`;
    $('mana').textContent = `${Math.floor(p.mana)} / ${p.maxMana}`;
    $('healthFill').style.height = p.hp / p.maxHp * 100 + '%';
    $('manaFill').style.height = p.mana / p.maxMana * 100 + '%';
    $('kills').textContent = `${state.kills} / 12`;
    $('questProgress').style.width = state.kills / 12 * 100 + '%';
    $('gold').textContent = state.gold;
    $('potions').textContent = `회복약 × ${p.potions}`;
    $('level').textContent = `LEVEL ${state.level}`;
    $('xp').style.width = state.xp % 100 + '%';
    $('items').textContent = state.inventory.join(' · ') || '획득한 장비가 없습니다.';
    $('overlay').hidden = !paused && state.status === 'playing';
    $('overlayTitle').textContent = state.status === 'won'
        ? '수도원에 찾아온 여명'
        : state.status === 'dead'
            ? '불씨가 사그라졌습니다'
            : '잠시 쉬어가는 시간';
    $('overlayText').textContent = state.status === 'won'
        ? `모든 적을 처치했습니다. ${state.gold} 금화 획득.`
        : state.status === 'dead'
            ? '새 원정으로 다시 도전하세요.'
            : '원정을 계속할 준비가 되면 돌아오세요.';
    $('resumeButton').hidden = state.status !== 'playing';
}

function perform(type) {
    if (!gameReady || paused) return;
    const ok = action(state, type);
    if (state.status === 'won') {
        state.loot.forEach(l => {
            state.gold += l.gold;
            if (l.item) state.inventory.push(l.item);
        });
        state.loot = [];
    }
    if (ok) {
        const messages = {
            fire: '화염 파동 · 마나 −18',
            potion: '회복약 · 생명력 회복',
        };
        $('toast').textContent = messages[type] || '가르기';
    } else if (type === 'fire' && state.player.mana < 18) {
        $('toast').textContent = '마나가 부족합니다.';
    }
}

function togglePause() {
    if (!gameReady) return;
    if (state.status === 'playing') paused = !paused;
    keys.clear();
}

function restart() {
    state = createGame();
    paused = false;
    keys.clear();
    target = null;
    facing.clear();
    positions.clear();
    $('toast').textContent = '새 원정이 시작되었습니다.';
}

$('pauseButton').onclick = togglePause;
$('resumeButton').onclick = togglePause;
$('restartButton').onclick = restart;
$('attack').onclick = () => perform('attack');
$('fire').onclick = () => perform('fire');
$('potion').onclick = () => perform('potion');
$('inventoryButton').onclick = () => {
    $('inventory').hidden = !$('inventory').hidden;
};
$('closeInventory').onclick = () => {
    $('inventory').hidden = true;
};
$('journalButton').onclick = () => {
    $('quest').hidden = !$('quest').hidden;
};
// 이동과 Space는 누른 상태를 매 프레임 읽습니다. Q/1 등은 최초 입력만 처리합니다.
function handleKeyDown(event) {
    if (!gameReady) return;
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) event.preventDefault();
    keys.add(event.code);
    if (event.repeat) return;
    if (event.code === 'KeyQ') perform('fire');
    if (event.code === 'Digit1') perform('potion');
    if (event.code === 'Escape') togglePause();
    if (event.code === 'KeyI') $('inventoryButton').click();
    if (event.code === 'KeyJ') $('journalButton').click();
}

window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', e => keys.delete(e.code));
window.addEventListener('blur', () => {
    keys.clear();
    if (state.status === 'playing') paused = true;
});
/** 클릭 좌표를 월드 좌표로 되돌려 목적지를 지정하거나 가까운 적을 공격합니다. */
function handlePointerDown(event) {
    if (!gameReady || paused || state.status !== 'playing') return;
    const r = canvas.getBoundingClientRect(),
        px = (event.clientX - r.left - width * 0.49) / (32 * scale) + state.player.x - state.player.y,
        py = (event.clientY - r.top - height * 0.53) / (16 * scale) + state.player.x + state.player.y;
    target = {x: Math.max(1, Math.min(17, (px + py) / 2)), y: Math.max(1, Math.min(17, (py - px) / 2))};
    const enemy = state.enemies.find(n => n.hp > 0 && Math.hypot(n.x - target.x, n.y - target.y) < 1);
    if (enemy && Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y) < 1.65) {
        perform('attack');
        target = null;
    }
}

canvas.addEventListener('pointerdown', handlePointerDown);
let last = 0;

/** 키보드 이동이 클릭 목적지보다 우선합니다. 화면 방향을 월드 방향으로 바꿉니다. */
function readMovementInput() {
    const screenX = Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft')),
        screenY = Number(keys.has('KeyS') || keys.has('ArrowDown')) - Number(keys.has('KeyW') || keys.has('ArrowUp'));
    let dx = screenX + screenY;
    let dy = screenY - screenX;
    if (dx || dy) {
        target = null;
    } else if (target) {
        dx = target.x - state.player.x;
        dy = target.y - state.player.y;
        if (Math.hypot(dx, dy) < 0.12) {
            target = null;
            dx = dy = 0;
        }
    }
    return { dx, dy };
}

/** 브라우저가 요청하는 매 프레임: 입력 → 시뮬레이션 → 그리기. */
function frame(time) {
    const dt = Math.min((time - last) / 1000, 0.05);
    last = time;
    if (gameReady && !paused) {
        const movement = readMovementInput();
        step(state, movement, dt);
        if (keys.has('Space')) perform('attack');
    }
    render();
    requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

// ?harness=1에서만 외부 검증 도구가 고정 시간 간격으로 게임을 조작할 수 있습니다.
if (new URLSearchParams(location.search).has('harness')) {
    window.__game = {
        snapshot: () => structuredClone(state),
        reset: (seed = 666) => {
            state = createGame(seed);
            paused = true;
            return structuredClone(state);
        },
        step: (input = {}, ticks = 1) => {
            for (let i = 0; i < Math.min(3600, Math.max(0, ticks)); i++) step(state, input, 1 / 60);
            render();
            return structuredClone(state);
        },
        action: type => {
            action(state, type);
            collect(state);
            render();
            return structuredClone(state);
        }
    };
}
