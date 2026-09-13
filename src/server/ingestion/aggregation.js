export function titleSimilarity(a,b) {
  if(a===b) return 1;
  if(a.length<12 || b.length<12) return 0;
  const grams=value=>new Set(Array.from({length:value.length-1},(_,i)=>value.slice(i,i+2)));
  const left=grams(a),right=grams(b);
  const overlap=[...left].filter(value=>right.has(value)).length;
  return 2*overlap/(left.size+right.size);
}
