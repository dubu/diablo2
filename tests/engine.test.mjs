import test from'node:test';import assert from'node:assert/strict';import{createGame,step,action,collect}from'../src/engine.js';
test('seed reproduces world',()=>{assert.deepEqual(createGame(77),createGame(77));assert.notDeepEqual(createGame(77).enemies,createGame(78).enemies);});
test('movement remains in map and diagonal speed is normalized',()=>{const a=createGame(),b=createGame();a.enemies=[];b.enemies=[];step(a,{dx:1},.1);step(b,{dx:1,dy:1},.1);assert.ok(Math.abs(Math.hypot(a.player.x-8,a.player.y-10)-Math.hypot(b.player.x-8,b.player.y-10))<1e-9);for(let i=0;i<1000;i++)step(a,{dx:1},.1);assert.equal(a.player.x,17);});
test('mana and cooldown prevent free repeated casts',()=>{const s=createGame();s.enemies=[];assert.equal(action(s,'fire'),true);assert.equal(s.player.mana,282);assert.equal(action(s,'fire'),false);s.player.cooldown=0;s.player.mana=17;assert.equal(action(s,'fire'),false);});
test('kill awards XP once and loot collection is idempotent',()=>{const s=createGame();s.enemies=[{id:1,x:8,y:10,hp:20,maxHp:20,type:'smith'}];action(s,'attack');assert.equal(s.status,'won');assert.equal(s.xp,25);collect(s);collect(s);assert.equal(s.gold,15);assert.deepEqual(s.inventory,['잿불의 도끼']);action(s,'attack');assert.equal(s.xp,25);});
test('damage, potions, death and terminal state',()=>{const s=createGame();s.enemies=[{id:0,x:8,y:10,hp:99,type:'smith',cooldown:0}];step(s);assert.equal(s.player.hp,994);action(s,'potion');assert.equal(s.player.hp,1000);assert.equal(s.player.potions,19);assert.equal(action(s,'potion'),false);s.player.hp=1;s.enemies[0].cooldown=0;step(s);assert.equal(s.status,'dead');const before=structuredClone(s);step(s,{dx:1});assert.deepEqual(s,before);assert.equal(action(s,'potion'),false);});

test('easy mode survives five minutes surrounded with its starting potion supply',()=>{
 const s=createGame();
 for(const e of s.enemies){e.x=s.player.x;e.y=s.player.y;e.cooldown=0;}
 for(let i=0;i<3000;i++){step(s,{},.1);if(s.player.hp<500)action(s,'potion');}
 assert.equal(s.status,'playing');assert.ok(s.player.hp>0);assert.ok(s.player.potions>0);assert.ok(s.player.potions<20);
});
test('recovery respects boosted caps and depleted potion inventory',()=>{
 const s=createGame();s.enemies=[];s.player.hp=100;s.player.mana=0;
 assert.equal(action(s,'potion'),true);assert.equal(s.player.hp,600);
 assert.equal(action(s,'potion'),true);assert.equal(s.player.hp,1000);
 assert.equal(action(s,'potion'),false);assert.equal(s.player.potions,18);
 for(let i=0;i<300;i++)step(s,{},.1);
 assert.equal(s.player.mana,300);
 s.player.hp=10;s.player.potions=0;assert.equal(action(s,'potion'),false);assert.equal(s.player.hp,10);
});
