const fs = require('fs');

let coords = fs.readFileSync('src/utils/coordinates.ts', 'utf8');

// Sahte rakim algoritmasini 0 dondurecek sekilde eziyoruz
coords = coords.replace(/export function getSimulatedElevation[\s\S]*?\}\n/, 
`export function getSimulatedElevation(lat: number, lng: number): number {
    return 0; // Matrix hatasi duzeltildi, sehir tekrar duz :)
}\n`);

fs.writeFileSync('src/utils/coordinates.ts', coords);
