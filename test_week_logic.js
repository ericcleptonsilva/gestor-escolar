const deliveryForm = { metadata: { week: "Segunda (2023-10-23), Quarta" } };

const parseWeek = (weekStr) => {
    const map = {};
    if (!weekStr) return map;
    weekStr.split(',').forEach(part => {
        const match = part.trim().match(/^(.+?)(?:\s\((.+)\))?$/);
        if (match) {
            const d = match[1];
            const date = match[2] || '';
            if (['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'].includes(d)) {
                map[d] = date;
            }
        }
    });
    return map;
};

const updateWeekMetadata = (newMap) => {
    const order = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
    const parts = order
        .filter(d => newMap.hasOwnProperty(d))
        .map(d => newMap[d] ? `${d} (${newMap[d]})` : d);
    return parts.join(', ');
};

const weekMap = parseWeek(deliveryForm.metadata.week);
console.log("Parsed:", weekMap);

// Simulate checking "Sexta"
const newMap1 = { ...weekMap };
newMap1['Sexta'] = '';
console.log("Add Sexta:", updateWeekMetadata(newMap1));

// Simulate unchecking "Segunda"
const newMap2 = { ...weekMap };
delete newMap2['Segunda'];
console.log("Remove Segunda:", updateWeekMetadata(newMap2));

// Simulate adding date to "Quarta"
const newMap3 = { ...weekMap };
newMap3['Quarta'] = '2023-10-25';
console.log("Update Quarta Date:", updateWeekMetadata(newMap3));
