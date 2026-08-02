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

  // 1. Génération de chaque personne (0 = racine)
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

  // 2. Regroupe les couples (partenaires de même génération, affichés côte à côte)
  const partnerOf = new Map();
  partnerships.forEach((p) => {
    if (!personById.has(p.person1Id) || !personById.has(p.person2Id)) return;
    if (!partnerOf.has(p.person1Id)) partnerOf.set(p.person1Id, []);
    if (!partnerOf.has(p.person2Id)) partnerOf.set(p.person2Id, []);
    partnerOf.get(p.person1Id).push(p.person2Id);
    partnerOf.get(p.person2Id).push(p.person1Id);
  });

  const maxGen = Math.max(0, ...Array.from(generationOf.values()));
  const genGroups = [];
  const personToGroup = new Map();
  let groupCounter = 0;

  for (let gen = 0; gen <= maxGen; gen++) {
    const peopleInGen = persons.filter((p) => generationOf.get(p.id) === gen);
    const placed = new Set();
    const groups = [];

    peopleInGen.forEach((person) => {
      if (placed.has(person.id)) return;
      const partnerIds = (partnerOf.get(person.id) || []).filter(
        (id) => generationOf.get(id) === gen && !placed.has(id)
      );
      const groupId = `g${groupCounter++}`;
      if (partnerIds.length > 0) {
        placed.add(person.id);
        placed.add(partnerIds[0]);
        const partner = personById.get(partnerIds[0]);
        groups.push({ id: groupId, members: [person, partner], childGroupIds: [] });
        personToGroup.set(person.id, groupId);
        personToGroup.set(partner.id, groupId);
      } else {
        placed.add(person.id);
        groups.push({ id: groupId, members: [person], childGroupIds: [] });
        personToGroup.set(person.id, groupId);
      }
    });

    genGroups.push(groups);
  }

  const groupById = new Map();
  genGroups.forEach((groups) => groups.forEach((g) => groupById.set(g.id, g)));

  // 3. Rattache chaque personne au groupe de son premier parent (parent "principal")
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
    return group.members.length === 2 ? CARD_WIDTH * 2 + COUPLE_GAP : CARD_WIDTH;
  }

  // 4. Largeur du sous-arbre de chaque groupe (calcul du bas vers le haut) :
  //    un groupe réserve au moins la somme des largeurs de ses enfants.
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

  // 5. Positionnement du haut vers le bas : chaque groupe est centré sur son sous-arbre,
  //    ses enfants sont répartis et centrés sous lui.
  const positions = new Map();

  function placeGroup(groupId, centerX, y) {
    const group = groupById.get(groupId);

    if (group.members.length === 2) {
      const totalWidth = CARD_WIDTH * 2 + COUPLE_GAP;
      const startX = centerX - totalWidth / 2;
      positions.set(group.members[0].id, { x: startX, y, width: CARD_WIDTH });
      positions.set(group.members[1].id, { x: startX + CARD_WIDTH + COUPLE_GAP, y, width: CARD_WIDTH });
    } else {
      positions.set(group.members[0].id, { x: centerX - CARD_WIDTH / 2, y, width: CARD_WIDTH });
    }

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

  // Place les groupes racines (génération 0) de gauche à droite
  let rootCursor = 0;
  genGroups[0]?.forEach((g) => {
    const w = subtreeWidth.get(g.id);
    placeGroup(g.id, rootCursor + w / 2, 0);
    rootCursor += w + SUBTREE_GAP;
  });

  // Filet de sécurité : place tout groupe qui n'aurait pas été atteint depuis une racine
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

  // 6. Recentre tout l'arbre pour qu'il commence à x=0 avec une marge
  const minX = Math.min(...Array.from(positions.values()).map((p) => p.x));
  const shiftX = -minX + 30;
  positions.forEach((pos) => { pos.x += shiftX; });

  // 7. Lignes parent -> enfant, pour TOUTES les relations (pas seulement le parent principal)
  const lines = parentChildRelations
    .map(({ parentId, childId }) => {
      const p = positions.get(parentId);
      const c = positions.get(childId);
      if (!p || !c) return null;
      return {
        x1: p.x + CARD_WIDTH / 2,
        y1: p.y + CARD_HEIGHT,
        x2: c.x + CARD_WIDTH / 2,
        y2: c.y,
      };
    })
    .filter(Boolean);

  const allX = Array.from(positions.values()).map((p) => p.x + CARD_WIDTH);
  const allY = Array.from(positions.values()).map((p) => p.y + CARD_HEIGHT);
  const canvasWidth = Math.max(600, ...allX) + 60;
  const canvasHeight = Math.max(400, ...allY) + 60;

  const placedPersons = persons
    .filter((p) => positions.has(p.id))
    .map((p) => ({ ...p, ...positions.get(p.id) }));

  return { placedPersons, lines, canvasWidth, canvasHeight };
}