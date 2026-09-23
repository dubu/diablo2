import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, action, step, FIRE_RANGE } from '../src/engine.js';

test('fire damages only inside its visual radius and its lingering flames do not repeat damage', () => {
    const game = createGame();
    game.enemies = [FIRE_RANGE - 0.01, FIRE_RANGE + 0.01].map((distance, id) => ({
        id, type: 'smith', x: game.player.x + distance, y: game.player.y,
        hp: 100, maxHp: 100, cooldown: 100,
    }));
    action(game, 'fire');
    assert.deepEqual(game.enemies.map(enemy => enemy.hp), [62, 100]);
    for (let i = 0; i < 30; i++) step(game, {}, 1 / 60);
    assert.ok(game.effects.some(effect => effect.type === 'fire'));
    for (let i = 0; i < 30; i++) step(game, {}, 1 / 60);
    assert.ok(!game.effects.some(effect => effect.type === 'fire'));
    assert.deepEqual(game.enemies.map(enemy => enemy.hp), [62, 100]);
});
