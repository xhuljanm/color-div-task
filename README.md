# Color Div Task

## Struktura e kodit
- **Krijimi i klasit:**
  - Krijohet nje `ColorContainer` permban te gjitha funksionalitetet.

- **Inicializimi:**
  - Ne constructor deklarojm variablat e nevojshme me nje value 0 ose null, dhe gjithashtu `undoStack`, `redoStack` si arrays ku do te permbajn te gjitha ngjyrat perkatese sipas funksionalitetit te meposhtem.
  - Vendosoet event listener per butonat, duke i lidhur ato me funksionet per te gjeneruar ngjyre, per ta kthyer mbrapa (undo) dhe per ta vendosur serisht (redo).
  - Konvertohet ne formatin hexadecimal (optional).
  - Ngjyra tekstit ne div-in `colorSquare` (clickCount) eshte ngjyra e kontrastit te `colorSquare`.

## Funksionalitetet:
### `generateNewColor`:
- Gjeneron nje ngjyre te re ku aplikohet ne `colorSquare`.
- Perdoret `while` loop deri sa ngjyra te gjenerohet ne menyre random dhe validohet nga funksionet `isGray`, `isWhite`, `isTooBright`, `isToDark`.

### `updateSquare`:
- Aplikon ngjyren e gjeneruar dhe ngjyren e `clickCount`.

### `updateLists`:
- Perditeson listat e ngjyrave ne `undo` dhe `redo`.
- Krijon div-in per secilen ngjyre dhe therret funksionin `drag&drop`.

### `toggleList`:
- Duke perdorus switch kontrollojm vleren type per `undo` ose `redo`.
- Nese vlera e type eshte `undo`, kontrollon nese `undoListDiv` eshte e dukshme me `display: flex;`. Nese po, e fsheh, nese jo e ben te dukshme `flex`.
- Nse njerat nga vlera eshte e dukshme, overlay behet i dukshem (`display: flex;`) nese jo fshihet (`none`). (Mobile responsive)

### `initDragAndDrop`:
- Krijohet nje "loop" per te vendosur `ondragover` dhe `ondrop` cdo div ne `undoListDiv`.
- `event.preventDefault()` lejohet hedhja e elementeve.
- Per `redoListDiv` aplikohet e njejta gje.
- Therritet funksioni `handleDrop`.

### `handleDrop`:
- Mundeson hedhjen e ngjyrave ne listen `undo`.
- `event.dataTransfer.getData` merr indeksin dhe llojin e listes nga hedhja.
- **Heqja nga undo:**
  - Nese ngjyra eshte hedhur nga lista `undo`, hiqet nga `undoStack` dhe ne varesi te llojit te `listType` dhe `targetId` ngjyra mund te shtohet:
    - Per undo: Nese ngjyra hidhet ne `undoStack`, shtohet ne vendin e `targetId`.
    - Per redo: Nese ngjyra hidhet ne listen `redo`, shtohet ne `redoStack`.

- **Heqja nga redo:**
  - Nese ngjyra eshte hedhur nga lista `redo`, hiqet nga `redoStack`:
    - Per redo: Nese ngjyra hidhet ne `redoStack`, shtohet ne vendin e `targetId`.
    - Per undo: Nese ngjyra hidhet ne listen `undo`, shtohet ne `undoStack`.

- Therritet `updateLists` dhe `updateSquare` per te perditesuar listat dhe box-in `colorSquare`.

### `rgbToHex`:
- Konverton vlerat RGB ne formatin hexadecimal.

### `reset`:
- Rikthen variablat ne gjendjen fillestare.
- Perditeson `colorSquare` dhe listat.

### `isGrey`, `isWhite`, `isTooBright`, `isToDark`:
- Sigurojne gjenerimi i ngjyrave te plotesoje kriteret e duhura sipas funksioneve.