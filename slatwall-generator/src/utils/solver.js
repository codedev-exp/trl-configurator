// Dostępne szerokości modułów standardowych (w cm) - posortowane od największego
const MODULES = [200, 120, 100, 80, 40];

// Generuje wszystkie możliwe moduły co 10cm (40, 50, 60... 200)
function getAllModules() {
    const modules = [];
    for (let i = 40; i <= 200; i += 10) {
        modules.push(i);
    }
    return modules.sort((a, b) => b - a); // Sortuj od największego
}

// Znajdź kombinacje modułów dla danej szerokości (maksymalnie 4 moduły)
function findExactCombinations(target, modules, maxDepth = 4) {
    const results = [];
    const seen = new Set();
    
    function backtrack(remaining, path, startIdx) {
        if (remaining === 0) {
            const key = [...path].sort((a, b) => b - a).join(',');
            if (!seen.has(key)) {
                seen.add(key);
                results.push([...path]);
            }
            return;
        }
        
        if (remaining < 0 || path.length >= maxDepth) {
            return;
        }
        
        for (let i = startIdx; i < modules.length; i++) {
            const mod = modules[i];
            if (mod <= remaining) {
                path.push(mod);
                backtrack(remaining - mod, path, i);
                path.pop();
            }
        }
    }
    
    backtrack(target, [], 0);
    return results;
}

export function solveLayout(targetWidthCm) {
    if (!targetWidthCm || targetWidthCm < 40) return [];

    const solutions = [];
    const standardModules = MODULES;
    const allModules = getAllModules();

    // 1. STRATEGIA "GREEDY" (Najmniej łączeń) - tylko standardowe moduły
    let remaining = targetWidthCm;
    let greedyModules = [];
    
    for (let mod of standardModules) {
        while (remaining >= mod) {
            greedyModules.push(mod);
            remaining -= mod;
        }
    }
    
    // Jeśli pasuje idealnie
    if (remaining === 0) {
        solutions.push({
            type: 'Ekonomiczny (Najmniej modułów)',
            modules: [...greedyModules],
            count: greedyModules.length
        });
    }

    // 2. STRATEGIA "SYMETRIA" (Powtarzalne moduły) - tylko standardowe
    for (let mod of standardModules) {
        if (targetWidthCm % mod === 0) {
            const count = targetWidthCm / mod;
            const isSameAsGreedy = (greedyModules.length === count && greedyModules.every(m => m === mod));
            
            if (!isSameAsGreedy && count <= 10) {
                solutions.push({
                    type: `Symetryczny (${count} x ${mod}cm)`,
                    modules: Array(count).fill(mod),
                    count: count
                });
            }
        }
    }

    // 3. STRATEGIA "DOPASOWANIE Z DOCIĘCIEM" (Jeśli greedy zostawił dziurę)
    if (remaining > 0) {
        const smallestFit = [...standardModules].reverse().find(m => m >= remaining);
        
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

    // 4. STRATEGIA "KOMBINACJE Z MODUŁAMI CO 10CM" (dla wymiarów jak 370)
    // Szukamy dokładnych kombinacji używając modułów co 10cm
    const combinations = findExactCombinations(targetWidthCm, allModules, 4);
    
    // Sortuj kombinacje: najpierw po liczbie modułów, potem preferuj standardowe
    const sortedCombinations = combinations
        .map(combo => ({
            combo: combo,
            count: combo.length,
            hasStandard: combo.every(m => standardModules.includes(m)),
            key: combo.sort((a, b) => b - a).join(',')
        }))
        .sort((a, b) => {
            if (a.count !== b.count) return a.count - b.count;
            if (a.hasStandard && !b.hasStandard) return -1;
            if (!a.hasStandard && b.hasStandard) return 1;
            return 0;
        });
    
    // Dodaj najlepsze kombinacje (maksymalnie 3 dodatkowe, unikalne)
    const addedKeys = new Set();
    for (const item of sortedCombinations) {
        if (addedKeys.size >= 3) break;
        
        const isDuplicate = solutions.some(sol => {
            const solKey = sol.modules.sort((a, b) => b - a).join(',');
            return solKey === item.key;
        });
        
        if (!isDuplicate && !addedKeys.has(item.key)) {
            addedKeys.add(item.key);
            const type = item.hasStandard 
                ? `Kombinacja (${item.combo.join(' + ')}cm)`
                : `Kombinacja niestandardowa (${item.combo.join(' + ')}cm)`;
            
            solutions.push({
                type: type,
                modules: item.combo.sort((a, b) => b - a),
                count: item.count
            });
        }
    }

    // Sortuj: najpierw po liczbie modułów, potem preferuj standardowe
    return solutions.sort((a, b) => {
        if (a.count !== b.count) return a.count - b.count;
        // Jeśli ta sama liczba, preferuj standardowe moduły
        const aHasStandard = a.modules.every(m => standardModules.includes(m));
        const bHasStandard = b.modules.every(m => standardModules.includes(m));
        if (aHasStandard && !bHasStandard) return -1;
        if (!aHasStandard && bHasStandard) return 1;
        return 0;
    }).slice(0, 5); // Maksymalnie 5 opcji
}

