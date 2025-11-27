// Dostępne szerokości modułów (w cm) - posortowane od największego
const MODULES = [200, 120, 100, 80, 40];

export function solveLayout(targetWidthCm) {
    if (!targetWidthCm || targetWidthCm < 40) return [];

    const solutions = [];

    // 1. STRATEGIA "GREEDY" (Najmniej łączeń)
    let remaining = targetWidthCm;
    let greedyModules = [];
    
    for (let mod of MODULES) {
        while (remaining >= mod) {
            greedyModules.push(mod);
            remaining -= mod;
        }
    }
    
    // Jeśli pasuje idealnie
    if (remaining === 0) {
        solutions.push({
            type: 'Ekonomiczny (Najmniej modułów)',
            modules: [...greedyModules], // kopia tablicy
            count: greedyModules.length
        });
    }

    // 2. STRATEGIA "SYMETRIA" (Powtarzalne moduły)
    for (let mod of MODULES) {
        if (targetWidthCm % mod === 0) {
            const count = targetWidthCm / mod;
            // Sprawdź czy to nie duplikat strategii greedy
            const isSameAsGreedy = (greedyModules.length === count && greedyModules.every(m => m === mod));
            
            if (!isSameAsGreedy) {
                solutions.push({
                    type: `Symetryczny (${count} x ${mod}cm)`,
                    modules: Array(count).fill(mod),
                    count: count
                });
            }
        }
    }

    // 3. STRATEGIA "DOPASOWANIE" (Jeśli greedy zostawił dziurę)
    if (remaining > 0) {
        // Znajdź najmniejszy moduł, który jest większy niż dziura
        // Tablica jest malejąca, więc reverse() daje rosnącą [40, 80...]
        const smallestFit = [...MODULES].reverse().find(m => m >= remaining);
        
        if (smallestFit) {
             const modulesWithCut = [...greedyModules, smallestFit];
             solutions.push({
                type: 'Dopasowany (wymaga docinania)',
                modules: modulesWithCut,
                count: modulesWithCut.length,
                isCut: true,
                originalWidth: targetWidthCm
            });
        }
    }

    return solutions.sort((a, b) => a.count - b.count);
}

