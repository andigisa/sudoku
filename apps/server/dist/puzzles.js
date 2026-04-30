const easy = [
    {
        puzzle_id: "easy-001",
        givens: "000260701680070090190004500820100040004602900050003028009300074040050036703018000",
        difficulty: "easy",
        generator_version: "pack-v1",
        solution_checksum: "sha256:easy-001",
        solution: "435269781682571493197834562826195347374682915951743628519326874248957136763418259"
    },
    {
        puzzle_id: "easy-002",
        givens: "001306807593100204800290015309700002000462900006039471004920000008043700030801500",
        difficulty: "easy",
        generator_version: "pack-v1",
        solution_checksum: "sha256:easy-002",
        solution: "421356897593187264867294315349718652715462938286539471674925183158643729932871546"
    }
];
const medium = [
    {
        puzzle_id: "medium-001",
        givens: "530070000600195000098000060800060003400803001700020006060000280000419005000080079",
        difficulty: "medium",
        generator_version: "pack-v1",
        solution_checksum: "sha256:medium-001",
        solution: "534678912672195348198342567859761423426853791713924856961537284287419635345286179"
    },
    {
        puzzle_id: "medium-002",
        givens: "200080300060070084030500209000105408000000000402706000301007040720040060004010003",
        difficulty: "medium",
        generator_version: "pack-v1",
        solution_checksum: "sha256:medium-002",
        solution: "245981376169273584837564219976125438513498627482736951391657842728349165654812793"
    }
];
const hard = [
    {
        puzzle_id: "hard-001",
        givens: "000000907000420180000705026100904000050000040000507009920108000034059000507000000",
        difficulty: "hard",
        generator_version: "pack-v1",
        solution_checksum: "sha256:hard-001",
        solution: "462831957795426183381795426173984265659312748248567319926178534834259671517643892"
    },
    {
        puzzle_id: "hard-002",
        givens: "000900002050123400030000160908000000070000090000000205091000050007439020400007000",
        difficulty: "hard",
        generator_version: "pack-v1",
        solution_checksum: "sha256:hard-002",
        solution: "814976532659123478732854169948265317275341896163798245391682754587439621426517983"
    }
];
const expert = [
    {
        puzzle_id: "expert-001",
        givens: "300200000000107000706030500070009080900020004010800050009040301000702000000008006",
        difficulty: "expert",
        generator_version: "pack-v1",
        solution_checksum: "sha256:expert-001",
        solution: "351286497492157638786934512275469183938521764614873259829645371163792845547318926"
    },
    {
        puzzle_id: "expert-002",
        givens: "005300000800000020070010500400005300010070006003200080060500009004000030000009700",
        difficulty: "expert",
        generator_version: "pack-v1",
        solution_checksum: "sha256:expert-002",
        solution: "145327698839654127672918543496185372218473956753296481367542819984761235521839764"
    }
];
const puzzlePack = { easy, medium, hard, expert };
const allPuzzles = [...easy, ...medium, ...hard, ...expert];
export function getRandomPuzzle(difficulty) {
    const puzzles = puzzlePack[difficulty];
    const index = Math.floor(Math.random() * puzzles.length);
    return puzzles[index];
}
export function getPuzzleById(puzzleId) {
    return allPuzzles.find((p) => p.puzzle_id === puzzleId);
}
export function listAllPuzzleIds() {
    return allPuzzles.map((p) => ({ puzzle_id: p.puzzle_id, difficulty: p.difficulty }));
}
//# sourceMappingURL=puzzles.js.map