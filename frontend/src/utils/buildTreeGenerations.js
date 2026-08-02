const CARD_WIDTH = 168;
const CARD_HEIGHT = 108;
const H_GAP = 64;
const V_GAP = 150;
const COUPLE_GAP = 28;

/**
 * Transforme les données brutes de /api/tree en une structure positionnée :
 * chaque personne reçoit des coordonnées (x, y), et chaque relation
 * parent-enfant devient un segment de ligne prêt à dessiner en SVG.
 */
export function buildTreeLayout({ persons, parentChildRelations, partnerships }) {
  const personById = new Map(persons.map((p) => [p.id, p]));

  const parentsOf = new Map();
  parentChildRelations.forEach(({ parentId, childId }) => {
    if (!parentsOf.has(childId)) parentsOf.set(childId, []);
    parentsOf.get(childId).push(parentId);
  });

  // 1. Génération de chaque personne (0 = racine, pas de parent connu)
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

  // 2. Regroupe les couples (partenaires de même génération affichés côte à côte)
  const partnerOf = new Map();
  partnerships.forEach((p) => {
    if (!partnerOf.has(p.person1Id)) partnerOf.set(p.person1Id, []);
    if (!partnerOf.has(p.person2Id)) partnerOf.set(p.person2Id, []);
    partnerOf.get(p.person1Id).push(p.person2Id);
    partnerOf.get(p.person2Id).push(p.person1Id);
  });

  const maxGen = Math.max(0, ...Array.from(generationOf.values()));
  const genGroups = [];

  for (let gen = 0; gen <= maxGen; gen++) {
    const peopleInGen = persons.filter((p) => generationOf.get(p.id) === gen);
    const placed = new Set();
    const groups = [];

    peopleInGen.forEach((person) => {
      if (placed.has(person.id)) return;
      const partnerIds = (partnerOf.get(person.id) || []).filter(
        (id) => generationOf.get(id) === gen && !placed.has(id)
      );
      if (partnerIds.length > 0) {
        placed.add(person.id);
        placed.add(partnerIds[0]);
        groups.push({ members: [person, personById.get(partnerIds[0])] });
      } else {
        placed.add(person.id);
        groups.push({ members: [person] });
      }
    });

    genGroups.push(groups);
  }

  function groupWidth(group) {
    return group.members.length === 2 ? CARD_WIDTH * 2 + COUPLE_GAP : CARD_WIDTH;
  }

  function placeGroupMembers(group, centerX, y, positions) {
    if (group.members.length === 2) {
      const totalWidth = CARD_WIDTH * 2 + COUPLE_GAP;
      const startX = centerX - totalWidth / 2;
      positions.set(group.members[0].id, { x: startX, y, width: CARD_WIDTH });
      positions.set(group.members[1].id, { x: startX + CARD_WIDTH + COUPLE_GAP, y, width: CARD_WIDTH });
    } else {
      positions.set(group.members[0].id, { x: centerX - CARD_WIDTH / 2, y, width: CARD_WIDTH });
    }
  }

  const positions = new Map();

  // Génération 0 : alignée de gauche à droite, dans l'ordre reçu
  let cursor = 0;
  genGroups[0]?.forEach((group) => {
    const w = groupWidth(group);
    const centerX = cursor + w / 2;
    placeGroupMembers(group, centerX, 0, positions);
    cursor += w + H_GAP;
  });

  // Générations suivantes : chaque groupe se positionne sous la moyenne de ses parents,
  // trié par position parentale pour garder les fratries groupées et éviter les croisements.
  for (let gen = 1; gen <= maxGen; gen++) {
    const groups = genGroups[gen] || [];

    const groupsWithDesiredX = groups.map((group) => {
      const parentIds = parentsOf.get(group.members[0].id) || [];
      const parentXs = parentIds
        .map((pId) => {
          const pos = positions.get(pId);
          return pos ? pos.x + CARD_WIDTH / 2 : undefined;
        })
        .filter((x) => x !== undefined);

      const desiredX = parentXs.length > 0
        ? parentXs.reduce((a, b) => a + b, 0) / parentXs.length
        : null;

      return { group, desiredX };
    });

    // Trie : les groupes avec parents connus d'abord (par position), puis les orphelins à la suite
    groupsWithDesiredX.sort((a, b) => {
      if (a.desiredX === null && b.desiredX === null) return 0;
      if (a.desiredX === null) return 1;
      if (b.desiredX === null) return -1;
      return a.desiredX - b.desiredX;
    });

    let genCursor = 0;
    groupsWithDesiredX.forEach(({ group, desiredX }) => {
      const w = groupWidth(group);
      const minCenter = genCursor + w / 2;
      const centerX = desiredX !== null ? Math.max(desiredX, minCenter) : minCenter;

      placeGroupMembers(group, centerX, gen * V_GAP, positions);
      genCursor = centerX + w / 2 + H_GAP;
    });
  }

  // 3. Segments de ligne parent -> enfant, à partir des positions finales
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