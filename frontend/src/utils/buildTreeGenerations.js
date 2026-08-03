const CARD_WIDTH = 168;
const CARD_HEIGHT = 108;
const COUPLE_GAP = 28;
const SUBTREE_GAP = 36;
const V_GAP = 150;

export function buildTreeLayout({ persons, parentChildRelations, partnerships }) {
  const personById = new Map(persons.map((p) => [p.id, p]));

  const parentsOf = new Map();
  parentChildRelations.forEach(({ parentId, childId }) => {
    if (!personById.has(parentId) || !personById.has(childId)) return;
    if (!parentsOf.has(childId)) parentsOf.set(childId, []);
    parentsOf.get(childId).push(parentId);
  });

  // 1. Génération initiale (0 = racine, pas de parent connu)
  const generationOf = new Map();
  function computeGeneration(personId, visited = new Set()) {
    if (generationOf.has(personId)) return generationOf.get(personId);
    if (visited.has(personId)) return 0;
    visited.add(personId);
    const parents = parentsOf.get(personId) || [];
    if (parents.length === 0) {
      generationOf.set(personId, 0);
      return 0;
    }
    const gen = Math.max(...parents.map((pId) => computeGeneration(pId, visited))) + 1;
    generationOf.set(personId, gen);
    return gen;
  }
  persons.forEach((p) => computeGeneration(p.id));

  const validPartnerships = partnerships.filter(
    (p) => personById.has(p.person1Id) && personById.has(p.person2Id)
  );

  // 2. Aligne la génération des conjoints (toujours identique), répercuté sur les descendants
  for (let pass = 0; pass < 20; pass++) {
    let changed = false;

    validPartnerships.forEach((p) => {
      const g1 = generationOf.get(p.person1Id) ?? 0;
      const g2 = generationOf.get(p.person2Id) ?? 0;
      const maxGen = Math.max(g1, g2);
      if (g1 !== maxGen) { generationOf.set(p.person1Id, maxGen); changed = true; }
      if (g2 !== maxGen) { generationOf.set(p.person2Id, maxGen); changed = true; }
    });

    parentChildRelations.forEach(({ parentId, childId }) => {
      if (!personById.has(parentId) || !personById.has(childId)) return;
      const parentGen = generationOf.get(parentId) ?? 0;
      const childGen = generationOf.get(childId) ?? 0;
      const minChildGen = parentGen + 1;
      if (childGen < minChildGen) { generationOf.set(childId, minChildGen); changed = true; }
    });

    if (!changed) break;
  }

  // 3. Union-Find : regroupe TOUTE une famille polygame (mari + toutes ses épouses)
  //    en un seul ensemble connecté, même s'il y a 3, 4 épouses ou plus.
  const parentUF = new Map();
  function find(id) {
    if (!parentUF.has(id)) parentUF.set(id, id);
    let root = id;
    while (parentUF.get(root) !== root) root = parentUF.get(root);
    let curr = id;
    while (parentUF.get(curr) !== root) {
      const next = parentUF.get(curr);
      parentUF.set(curr, root);
      curr = next;
    }
    return root;
  }
  function union(a, b) {
    const ra = find(a), rb = find(b);
    if (ra !== rb) parentUF.set(ra, rb);
  }
  persons.forEach((p) => find(p.id));
  validPartnerships.forEach((p) => union(p.person1Id, p.person2Id));

  // Compte les unions de chaque personne pour repérer le "pivot" (l'époux commun)
  const partnershipCountOf = new Map();
  validPartnerships.forEach((p) => {
    partnershipCountOf.set(p.person1Id, (partnershipCountOf.get(p.person1Id) || 0) + 1);
    partnershipCountOf.set(p.person2Id, (partnershipCountOf.get(p.person2Id) || 0) + 1);
  });

  const maxGen = Math.max(0, ...Array.from(generationOf.values()));
  const genGroups = [];
  const personToGroup = new Map();
  let groupCounter = 0;

  for (let gen = 0; gen <= maxGen; gen++) {
    const peopleInGen = persons.filter((p) => generationOf.get(p.id) === gen);
    const seenRoots = new Map(); // root -> group temporaire (liste de membres)

    peopleInGen.forEach((person) => {
      const root = find(person.id);
      if (!seenRoots.has(root)) seenRoots.set(root, []);
      seenRoots.get(root).push(person);
    });

    const groups = [];
    seenRoots.forEach((members) => {
      const groupId = `g${groupCounter++}`;

      let orderedMembers = members;
      if (members.length >= 3) {
        // Repère le pivot (celui qui a le plus d'unions) et alterne les conjoints autour de lui
        const pivot = members.reduce((best, m) =>
          (partnershipCountOf.get(m.id) || 0) > (partnershipCountOf.get(best.id) || 0) ? m : best
          , members[0]);
        const others = members.filter((m) => m.id !== pivot.id);
        const left = [];
        const right = [];
        others.forEach((m, idx) => (idx % 2 === 0 ? right.push(m) : left.push(m)));
        orderedMembers = [...left.reverse(), pivot, ...right];
      }

      groups.push({ id: groupId, members: orderedMembers, childGroupIds: [] });
      orderedMembers.forEach((m) => personToGroup.set(m.id, groupId));
    });

    genGroups.push(groups);
  }

  const groupById = new Map();
  genGroups.forEach((groups) => groups.forEach((g) => groupById.set(g.id, g)));

  // 4. Rattache chaque personne au groupe de son premier parent connu
  persons.forEach((person) => {
    const parents = parentsOf.get(person.id);
    if (!parents || parents.length === 0) return;
    const parentGroupId = personToGroup.get(parents[0]);
    const childGroupId = personToGroup.get(person.id);
    if (!parentGroupId || !childGroupId) return;
    const parentGroup = groupById.get(parentGroupId);
    if (parentGroup && !parentGroup.childGroupIds.includes(childGroupId)) {
      parentGroup.childGroupIds.push(childGroupId);
    }
  });

  function groupWidth(group) {
    const n = group.members.length;
    return n * CARD_WIDTH + (n - 1) * COUPLE_GAP;
  }

  // 5. Largeur du sous-arbre (bas vers le haut)
  const subtreeWidth = new Map();
  function computeSubtreeWidth(groupId) {
    if (subtreeWidth.has(groupId)) return subtreeWidth.get(groupId);
    const group = groupById.get(groupId);
    const ownWidth = groupWidth(group);
    const childIds = group.childGroupIds;

    if (childIds.length === 0) {
      subtreeWidth.set(groupId, ownWidth);
      return ownWidth;
    }

    const childrenTotal = childIds.reduce((sum, cid, idx) => {
      return sum + computeSubtreeWidth(cid) + (idx > 0 ? SUBTREE_GAP : 0);
    }, 0);

    const width = Math.max(ownWidth, childrenTotal);
    subtreeWidth.set(groupId, width);
    return width;
  }
  genGroups.forEach((groups) => groups.forEach((g) => computeSubtreeWidth(g.id)));

  // 6. Positionnement du haut vers le bas
  const positions = new Map();
  const groupCenterX = new Map();

  function placeGroup(groupId, centerX, y) {
    const group = groupById.get(groupId);
    groupCenterX.set(groupId, centerX);

    const totalWidth = groupWidth(group);
    const startX = centerX - totalWidth / 2;
    group.members.forEach((member, idx) => {
      const x = startX + idx * (CARD_WIDTH + COUPLE_GAP);
      positions.set(member.id, { x, y, width: CARD_WIDTH });
    });

    const childIds = group.childGroupIds;
    if (childIds.length > 0) {
      const totalChildrenWidth = childIds.reduce((sum, cid, idx) => {
        return sum + subtreeWidth.get(cid) + (idx > 0 ? SUBTREE_GAP : 0);
      }, 0);

      let cursor = centerX - totalChildrenWidth / 2;
      childIds.forEach((cid) => {
        const cw = subtreeWidth.get(cid);
        const childCenterX = cursor + cw / 2;
        const childGen = generationOf.get(groupById.get(cid).members[0].id);
        placeGroup(cid, childCenterX, childGen * V_GAP);
        cursor += cw + SUBTREE_GAP;
      });
    }
  }

  let rootCursor = 0;
  genGroups[0]?.forEach((g) => {
    const w = subtreeWidth.get(g.id);
    placeGroup(g.id, rootCursor + w / 2, 0);
    rootCursor += w + SUBTREE_GAP;
  });

  let fallbackCursor = rootCursor + 100;
  for (let gen = 0; gen <= maxGen; gen++) {
    genGroups[gen]?.forEach((g) => {
      const alreadyPlaced = g.members.every((m) => positions.has(m.id));
      if (!alreadyPlaced) {
        const w = groupWidth(g);
        placeGroup(g.id, fallbackCursor + w / 2, gen * V_GAP);
        fallbackCursor += w + SUBTREE_GAP;
      }
    });
  }

  const minX = Math.min(...Array.from(positions.values()).map((p) => p.x));
  const shiftX = -minX + 30;
  positions.forEach((pos) => { pos.x += shiftX; });
  groupCenterX.forEach((x, id) => groupCenterX.set(id, x + shiftX));

  // --- Lignes de mariage : relie le pivot à chacun de ses conjoints ---
  const marriageLines = [];
  genGroups.forEach((groups) => {
    groups.forEach((group) => {
      if (group.members.length < 2) return;

      const pivot = group.members.reduce((best, m) =>
        (partnershipCountOf.get(m.id) || 0) > (partnershipCountOf.get(best.id) || 0) ? m : best
        , group.members[0]);
      const pivotPos = positions.get(pivot.id);
      const y = pivotPos.y + CARD_HEIGHT / 2;

      group.members.forEach((m) => {
        if (m.id === pivot.id) return;
        const mPos = positions.get(m.id);
        const isRight = mPos.x > pivotPos.x;
        marriageLines.push({
          x1: isRight ? pivotPos.x + CARD_WIDTH : pivotPos.x,
          y1: y,
          x2: isRight ? mPos.x : mPos.x + CARD_WIDTH,
          y2: y,
        });
      });
    });
  });

  // --- Lignes de filiation : trait en "T" depuis chaque groupe-parent vers ses groupes-enfants ---
  const descentSegments = [];
  genGroups.forEach((groups) => {
    groups.forEach((group) => {
      if (group.childGroupIds.length === 0) return;

      const parentCenterX = groupCenterX.get(group.id);
      const parentY = positions.get(group.members[0].id).y;
      const parentBottomY = parentY + CARD_HEIGHT;
      const busY = parentY + CARD_HEIGHT + (V_GAP - CARD_HEIGHT) / 2;

      const childCenters = group.childGroupIds.map((cid) => groupCenterX.get(cid));
      const childTopY = positions.get(groupById.get(group.childGroupIds[0]).members[0].id).y;

      descentSegments.push({ x1: parentCenterX, y1: parentBottomY, x2: parentCenterX, y2: busY });

      if (childCenters.length > 1) {
        const minXc = Math.min(...childCenters);
        const maxXc = Math.max(...childCenters);
        descentSegments.push({ x1: minXc, y1: busY, x2: maxXc, y2: busY });
      }

      childCenters.forEach((cx) => {
        descentSegments.push({ x1: cx, y1: busY, x2: cx, y2: childTopY });
      });
    });
  });

  const allX = Array.from(positions.values()).map((p) => p.x + CARD_WIDTH);
  const allY = Array.from(positions.values()).map((p) => p.y + CARD_HEIGHT);
  const canvasWidth = Math.max(600, ...allX) + 60;
  const canvasHeight = Math.max(400, ...allY) + 60;

  const placedPersons = persons
    .filter((p) => positions.has(p.id))
    .map((p) => ({ ...p, ...positions.get(p.id) }));

  return { placedPersons, marriageLines, descentSegments, canvasWidth, canvasHeight };
}