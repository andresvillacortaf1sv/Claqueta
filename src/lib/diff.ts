/**
 * Diff por líneas (bloques) para comparar borradores. Usa la subsecuencia común
 * más larga (LCS) para producir una lista de operaciones iguales/añadidas/quitadas.
 */
export type DiffKind = "equal" | "add" | "del";

export interface DiffOp {
  kind: DiffKind;
  text: string;
}

export function diffLines(a: string[], b: string[]): DiffOp[] {
  const n = a.length;
  const m = b.length;
  // Tabla LCS
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ kind: "equal", text: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ kind: "del", text: a[i] });
      i++;
    } else {
      ops.push({ kind: "add", text: b[j] });
      j++;
    }
  }
  while (i < n) ops.push({ kind: "del", text: a[i++] });
  while (j < m) ops.push({ kind: "add", text: b[j++] });
  return ops;
}

export interface DiffStats {
  added: number;
  removed: number;
}

export function diffStats(ops: DiffOp[]): DiffStats {
  return {
    added: ops.filter((o) => o.kind === "add").length,
    removed: ops.filter((o) => o.kind === "del").length,
  };
}
