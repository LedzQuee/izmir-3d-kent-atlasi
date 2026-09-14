import { UIManager } from './ui/UIManager';
import { clearNearestStops } from './layers/OtobusDuraklariLayer';

window.addEventListener('error', function(event) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position:fixed; top:10px; left:10px; background:red; color:white; padding:20px; z-index:999999; font-weight:bold; max-width:80%; font-size:16px; border:2px solid white;';
    errorDiv.innerHTML = 'HATA OLUSTU: <br>' + event.message + '<br>Dosya: ' + event.filename + '<br>Satir: ' + event.lineno;
    document.body.appendChild(errorDiv);
});

window.addEventListener('unhandledrejection', function(event) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = 'position:fixed; top:10px; right:10px; background:darkred; color:white; padding:20px; z-index:999999; font-weight:bold; max-width:80%; font-size:16px; border:2px solid white;';
    errorDiv.innerHTML = 'PROMISE HATASI: <br>' + (event.reason ? event.reason.toString() : 'Bilinmiyor');
    document.body.appendChild(errorDiv);
});

﻿import * as THREE from 'three';
import './style.css';
import { Engine } from './core/Engine';
import { createLegend } from './utils/legend';

import { loadHavaalanlari } from './layers/HavaalanlariLayer';
import { loadKaplicalar } from './layers/KaplicalarLayer';
import { loadYetistirmeYurtlari } from './layers/YetistirmeYurtlariLayer';
import { loadTerminaller } from './layers/TerminallerLayer';
import { loadCocukGenclikMerkezleri } from './layers/CocukGenclikLayer';
import { loadAileDayanismaMerkezleri } from './layers/AileDayanismaLayer';
import { loadMeydanlar } from './layers/MeydanlarLayer';
import { loadPlajlar } from './layers/PlajlarLayer';
import { loadHuzurevleri } from './layers/HuzurevleriLayer';
import { loadToplumMerkezleri } from './layers/ToplumMerkezleriLayer';
import { loadIzbbHizmetNoktalari } from './layers/IzbbHizmetNoktalariLayer';
import { loadTaksiDuraklari } from './layers/TaksiDuraklariLayer';
import { loadAfetToplanmaAlanlari } from './layers/AfetToplanmaAlanlariLayer';

const engine = new Engine();
engine.start();

const groups = {
  havaalanlari: new THREE.Group(),
  kaplicalar: new THREE.Group(),
  yetistirme: new THREE.Group(),
  terminaller: new THREE.Group(),
  cocukGenclik: new THREE.Group(),
  aileDayanisma: new THREE.Group(),
  meydanlar: new THREE.Group(),
  plajlar: new THREE.Group(),
  huzurevleri: new THREE.Group(),
  toplum: new THREE.Group(),
  izbb: new THREE.Group(),
  taksiler: new THREE.Group(),
  afet: new THREE.Group()
};

Object.values(groups).forEach(g => engine.scene.add(g));

loadHavaalanlari(groups.havaalanlari);
loadKaplicalar(groups.kaplicalar);
loadYetistirmeYurtlari(groups.yetistirme);
loadTerminaller(groups.terminaller);
loadCocukGenclikMerkezleri(groups.cocukGenclik);
loadAileDayanismaMerkezleri(groups.aileDayanisma);
loadMeydanlar(groups.meydanlar);
loadPlajlar(groups.plajlar);
loadHuzurevleri(groups.huzurevleri);
loadToplumMerkezleri(groups.toplum);
loadIzbbHizmetNoktalari(groups.izbb);
loadTaksiDuraklari(groups.taksiler);
loadAfetToplanmaAlanlari(groups.afet);

createLegend([

    { name: 'Yakın Otobüs Durakları (Haritaya Tıklayın)', color: '#00ffaa', onToggle: v => {
        UIManager.busStopMode = v;
        // Kapatildiginda ekrandaki (varsa) otobus duraklarini sil
        if(!v && window.engineInstance) { 
            clearNearestStops(window.engineInstance.scene); 
        }
    }},
  { id: 'l1', color: '#00aaff', label: 'Havaalanları (5)', initialState: true, onToggle: v => groups.havaalanlari.visible = v },
  { id: 'l2', color: '#ff6600', label: 'Kaplıcalar (3)', initialState: true, onToggle: v => groups.kaplicalar.visible = v },
  { id: 'l3', color: '#00ff88', label: 'Yetiştirme Yurtları (5)', initialState: true, onToggle: v => groups.yetistirme.visible = v },
  { id: 'l4', color: '#ffff00', label: 'Terminaller (20)', initialState: true, onToggle: v => groups.terminaller.visible = v },
  { id: 'l5', color: '#ff66cc', label: 'Çocuk/Gençlik Merkezleri (15)', initialState: true, onToggle: v => groups.cocukGenclik.visible = v },
  { id: 'l6', color: '#aa00ff', label: 'Aile Dayanışma Merkezleri (2)', initialState: true, onToggle: v => groups.aileDayanisma.visible = v },
  { id: 'l7', color: '#ffffff', label: 'Meydanlar (96)', initialState: true, onToggle: v => groups.meydanlar.visible = v },
  { id: 'l8', color: '#00ffff', label: 'Plajlar (35)', initialState: true, onToggle: v => groups.plajlar.visible = v },
  { id: 'l9', color: '#ff3333', label: 'Huzurevleri (64)', initialState: true, onToggle: v => groups.huzurevleri.visible = v },
  { id: 'l10', color: '#cc8833', label: 'Toplum Merkezleri (6)', initialState: true, onToggle: v => groups.toplum.visible = v },
  { id: 'l11', color: '#0000aa', label: 'İzBB Hizmet Noktaları (269)', initialState: true, onToggle: v => groups.izbb.visible = v },
  { id: 'l12', color: '#ffcc00', label: 'Taksi Durakları (406)', initialState: true, onToggle: v => groups.taksiler.visible = v },
  { id: 'l13', color: '#00ff00', label: 'Afet Toplanma Alanları (2380)', initialState: true, onToggle: v => groups.afet.visible = v }
]);
