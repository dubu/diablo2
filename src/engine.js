/** 게임 규칙과 상태 갱신. DOM이나 이미지 없이 테스트할 수 있는 모듈입니다. */
export const LIMIT = 18;

// 프로토타입을 오래 플레이하기 위한 임시 쉬움 설정입니다.
export const BALANCE = Object.freeze({
    maxHp: 1000,
    maxMana: 300,
    potions: 20,
    potionHeal: 500,
    manaRegen: 15,
    incomingDamageMultiplier: 0.4,
});

/** 같은 시드를 사용하면 적의 위치와 초기 대기 시간이 동일하게 생성됩니다. */
export function random(seed) {
    let value = seed >>> 0;
    return () => {
        value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
        return value / 4294967296;
    };
}

function createEnemy(index, rng) {
    const isBoss = index === 11;
    return {
        id: index,
        x: 3 + rng() * 12,
        y: 2 + rng() * 12,
        hp: isBoss ? 150 : 44,
        maxHp: isBoss ? 150 : 44,
        type: isBoss ? 'smith' : index % 2 ? 'skeleton' : 'fallen',
        cooldown: 1 + rng(),
    };
}

/** 새 원정 시작: 플레이어와 적 12마리를 한 번 생성합니다. 재출현은 없습니다. */
export function createGame(seed = 666) {
    const rng = random(seed);
    return {
        seed,
        time: 0,
        status: 'playing',
        kills: 0,
        gold: 0,
        level: 1,
        xp: 0,
        inventory: [],
        effects: [],
        loot: [],
        player: {
            x: 8,
            y: 10,
            hp: BALANCE.maxHp,
            maxHp: BALANCE.maxHp,
            mana: BALANCE.maxMana,
            maxMana: BALANCE.maxMana,
            potions: BALANCE.potions,
            cooldown: 0,
        },
        enemies: Array.from({ length: 12 }, (_, index) => createEnemy(index, rng)),
    };
}

function distanceBetween(first, second) {
    return Math.hypot(first.x - second.x, first.y - second.y);
}

function usePotion(player) {
    if (player.potions === 0 || player.hp >= player.maxHp) return false;
    player.potions--;
    player.hp = Math.min(player.maxHp, player.hp + BALANCE.potionHeal);
    return true;
}

function dropEnemyLoot(state, enemy) {
    state.kills++;
    state.xp += 25;
    state.loot.push({
        x: enemy.x,
        y: enemy.y,
        gold: 12 + enemy.id * 3,
        item: enemy.type === 'smith' ? '잿불의 도끼' : null,
    });
}

/** 키보드와 화면 버튼이 공통으로 호출하는 공격/기술/회복약 처리입니다. */
export function action(state, type) {
    if (state.status !== 'playing') return false;
    const player = state.player;

    // 회복약은 공격 쿨다운과 독립적으로 사용할 수 있습니다.
    if (type === 'potion') return usePotion(player);
    if (player.cooldown > 0) return false;
    if (type === 'fire' && player.mana < 18) return false;
    if (!['attack', 'fire'].includes(type)) return false;

    const isFire = type === 'fire';
    const range = isFire ? 3.6 : 1.65;
    const damage = isFire ? 38 : 24;
    if (isFire) player.mana -= 18;
    player.cooldown = isFire ? 0.75 : 0.35;
    state.effects.push({ x: player.x, y: player.y, life: 0.4, type });

    // 현재 공격은 바라보는 방향과 관계없이 사거리 안의 모든 적에게 적용됩니다.
    for (const enemy of state.enemies) {
        if (enemy.hp <= 0 || distanceBetween(enemy, player) > range) continue;
        enemy.hp = Math.max(0, enemy.hp - damage);
        if (enemy.hp === 0) dropEnemyLoot(state, enemy);
    }

    state.level = 1 + Math.floor(state.xp / 100);
    if (state.kills === state.enemies.length) state.status = 'won';
    return true;
}

function movePlayer(player, input, dt) {
    const dx = input.dx || 0;
    const dy = input.dy || 0;
    const length = Math.hypot(dx, dy);
    if (!length) return;

    // 방향 벡터를 정규화하여 대각선 이동도 같은 속도를 유지합니다.
    player.x = Math.max(1, Math.min(LIMIT - 1, player.x + dx / length * dt * 3.8));
    player.y = Math.max(1, Math.min(LIMIT - 1, player.y + dy / length * dt * 3.8));
}

function updateEnemy(state, enemy, dt) {
    if (enemy.hp <= 0) return;
    const player = state.player;
    const distance = distanceBetween(player, enemy);
    enemy.cooldown = Math.max(0, enemy.cooldown - dt);

    // 감지 범위 내에서는 플레이어에게 직선으로 접근합니다. 장애물 회피는 미구현입니다.
    if (distance < 6 && distance > 0.8) {
        const speed = enemy.type === 'smith' ? 0.65 : 1.05;
        enemy.x += (player.x - enemy.x) / distance * dt * speed;
        enemy.y += (player.y - enemy.y) / distance * dt * speed;
    }

    // 기존 규칙대로 이번 갱신에서 이동하기 전의 거리로 공격 여부를 판정합니다.
    if (distance < 1.15 && enemy.cooldown === 0) {
        const damage = (enemy.type === 'smith' ? 15 : 5) * BALANCE.incomingDamageMultiplier;
        player.hp = Math.max(0, player.hp - damage);
        enemy.cooldown = 1.2;
        state.effects.push({ x: player.x, y: player.y, type: 'hurt', life: 0.2 });
    }
}

/** 한 프레임의 경과 시간(초)만큼 이동, 회복, 적 AI와 사망 판정을 갱신합니다. */
export function step(state, input = {}, dt = 1 / 60) {
    dt = Math.max(0, Math.min(dt, 0.1));
    if (state.status !== 'playing') return;

    state.time += dt;
    const player = state.player;
    player.cooldown = Math.max(0, player.cooldown - dt);
    player.mana = Math.min(player.maxMana, player.mana + dt * BALANCE.manaRegen);

    movePlayer(player, input, dt);
    for (const enemy of state.enemies) updateEnemy(state, enemy, dt);
    collect(state);
    state.effects = state.effects.filter(effect => {
        effect.life -= dt;
        return effect.life > 0;
    });
    if (player.hp === 0) state.status = 'dead';
}

/** 가까운 전리품을 획득한 뒤 바닥 목록에서 제거하여 중복 획득을 막습니다. */
export function collect(state) {
    state.loot = state.loot.filter(loot => {
        if (distanceBetween(loot, state.player) > 1.2) return true;
        state.gold += loot.gold;
        if (loot.item) state.inventory.push(loot.item);
        return false;
    });
}
