const fs = require('fs');
let code = fs.readFileSync('src/core/DistrictManager.ts', 'utf8');

// Sınıfın içine durumu takip edecek bir değişken ekleyelim
if (!code.includes('private pointsVisibleForLOD')) {
    code = code.replace(
        'private lastChildrenCount = 0;', 
        'private lastChildrenCount = 0;\n    private pointsVisibleForLOD = true;'
    );
}

// update() fonksiyonundaki LOD mantığını güncelliyoruz
const newUpdateLogic = `
        if (currentNodes !== this.lastChildrenCount && currentNodes > 0) {
            this.extractPoints();
            this.recalculateCounts();
            this.lastChildrenCount = currentNodes;
        }

        // --- NOKTALARIN YUKSEKLIGE GORE GIZLENMESI ---
        const altitude = this.camera.position.y;
        const SHOW_POINTS_THRESHOLD = 1800; // Yere 1800 birimden fazla yaklasinca veriler belirir

        const shouldShowPoints = altitude < SHOW_POINTS_THRESHOLD;
        if (this.pointsVisibleForLOD !== shouldShowPoints) {
            this.pointsVisibleForLOD = shouldShowPoints;
            this.setAllOriginalsVisible(shouldShowPoints);
        }

        // --- ETIKETLERIN MESAFEYE GORE YUMUSAK SAYDAMLASMASI (SMOOTH FADE) ---
        const FADE_START = 2200;
        const FADE_END = 1200;
`;

// Eski update logic'i bul ve değiştir
code = code.replace(
        /if \(currentNodes !== this\.lastChildrenCount && currentNodes > 0\) \{[\s\S]*?const FADE_START = 2200;/m, 
        newUpdateLogic
);

// recalculateCounts içinde setAllOriginalsVisible true yerine mevcut LOD durumunu kullansın
code = code.replace(/this\.setAllOriginalsVisible\(true\);/g, "this.setAllOriginalsVisible(this.pointsVisibleForLOD);");

// extractPoints içindeki hatalı görünürlük kontrolünü temizleyelim (çünkü noktalar LOD ile gizliyse bile sayılmalı)
const newExtractPoints = `
            if (node.type === 'Mesh' && node.userData && !node.userData.isDistrict && (node.userData.layerName || node.userData.record)) {
                const ilce = this.getIlceFromRecord(node.userData.record);
`;
code = code.replace(/if \(node\.type === 'Mesh' && node\.userData && !node\.userData\.isDistrict && \(node\.userData\.layerName \|\| node\.userData\.record\)\) \{\s*if \(node\.visible === false && this\.isZoomedOut === false\) return;/m, newExtractPoints);

fs.writeFileSync('src/core/DistrictManager.ts', code);
