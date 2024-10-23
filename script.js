class ColorContainer {
    constructor() {
        this.document = document;
        this.currentColor = null;
        this.color = null;
        this.clickCountColor = null;
        this.undoStack = [];
        this.redoStack = [];
        this.clickCount = {
			value: 0,
			color: {
				r: 0,
				g: 0,
				b: 0
			},
			hex: ''
		};
        this.undoListDiv = this.document.getElementById('undoList');
        this.redoListDiv = this.document.getElementById('redoList');

        // Button event listeners
        this.document.getElementById('colorButton').onclick = () => this.applyNewColor();
        this.document.getElementById('undoButton').onclick = () => this.applyUndoStack();
        this.document.getElementById('redoButton').onclick = () => this.applyRedoStack();
        this.document.getElementById('toggleUndo').onclick = () => this.toggleList('undo');
        this.document.getElementById('toggleRedo').onclick = () => this.toggleList('redo');

        // Initialize drag and drop
        this.initDragAndDrop();
    }

    isGray(r, g, b) {
        return r === g && g === b;
    }

    isWhite(r, g, b) {
        return r === 255 && g === 255 && b === 255;
    }

    isTooBright(r, g, b) {
        return r > 200 && g > 200 && b > 200;
    }

    isTooDark(r, g, b) {
        return r < 50 && g < 50 && b < 50;
    }

    updateSquare() {
        const square = this.document.getElementById('colorSquare');
        square.style.backgroundColor = this.currentColor;
        square.innerText = this.clickCount.value;
        square.style.color = this.clickCount.hex;
    }

    updateLists() {
        this.undoListDiv.innerHTML = this.undoStack.map((color, index) =>
            `<div id="undo-${index}" draggable="true" style="width: 15px; height: 15px; margin-left: 2px; background-color: ${color};" ondragstart="event.dataTransfer.setData('text/plain', '${index}-undo')"></div>`
        ).join('');

        this.redoListDiv.innerHTML = this.redoStack.map((color, index) =>
            `<div id="redo-${index}" draggable="true" style="width: 15px; height: 15px; margin: 2px; background-color: ${color};" ondragstart="event.dataTransfer.setData('text/plain', '${index}-redo')"></div>`
        ).join('');

        this.initDragAndDrop(); // Re-initialize after updating lists
    }

	toggleList(type) {
		switch(type) {
			case 'undo':
				this.undoListDiv.style.display = this.undoListDiv.style.display === 'flex' ? 'none' : 'flex';
				break;
			case 'redo':
				this.redoListDiv.style.display = this.redoListDiv.style.display === 'flex' ? 'none' : 'flex';
				break;
		}
	}

    initDragAndDrop() {
        const undoSquares = this.undoListDiv.children;
        const redoSquares = this.redoListDiv.children;

        // Drag and drop listeners to undo squares
        for (let square of undoSquares) {
            square.ondragover = (event) => event.preventDefault();
            square.ondrop = (event) => this.handleDrop(event, 'undo', square.id);
        }

		// Drag and drop listeners to redo squares
        for (let square of redoSquares) {
            square.ondragover = (event) => event.preventDefault();
            square.ondrop = (event) => this.handleDrop(event, 'redo', square.id);
        }

        // Allow dropping on both lists
        this.redoListDiv.ondragover = (event) => event.preventDefault();
        this.redoListDiv.ondrop = (event) => this.handleDrop(event, 'redo', null);

        this.undoListDiv.ondragover = (event) => event.preventDefault();
        this.undoListDiv.ondrop = (event) => this.handleDrop(event, 'undo', null);
    }

    handleDrop(event, listType, targetId) {
        event.preventDefault();
        const data = event.dataTransfer.getData('text/plain');
        const [draggedIndex, sourceList] = data.split('-');

		if (sourceList === 'undo') {
            const color = this.undoStack.splice(draggedIndex, 1)[0];

            if (listType === 'undo' && targetId) {
                this.undoStack.splice(targetId.split('-')[1], 0, color);
            } else if (listType === 'redo') {
                this.redoStack.push(color);
            }
        } else if (sourceList === 'redo') {
            const color = this.redoStack.splice(draggedIndex, 1)[0];

            if (listType === 'redo' && targetId) {
                this.redoStack.splice(targetId.split('-')[1], 0, color);
            } else if (listType === 'undo') {
                this.undoStack.push(color);
            }
        }

        this.updateLists(); // Refresh the lists to reflect changes
		this.updateSquare();
    }

    generateNewColor() {
        let r, g, b, clickCountR, clickCountG, clickCountB;

        while (true) { // Generate random RGB values
            r = Math.floor(Math.random() * 256);
            g = Math.floor(Math.random() * 256);
            b = Math.floor(Math.random() * 256);

            clickCountR = (255 - r).toString(16).padStart(2, '0');
            clickCountG = (255 - g).toString(16).padStart(2, '0');
            clickCountB = (255 - b).toString(16).padStart(2, '0');

            if (!this.isGray(r, g, b) && !this.isTooBright(r, g, b) && !this.isTooDark(r, g, b)) break; // Exit loop if valid color
        }

        this.color = this.rgbToHex(r, g, b); // Convert RGB to Hex
        this.clickCount.hex = this.rgbToHex(clickCountR, clickCountG, clickCountB);
    }

    rgbToHex(r, g, b) {
        const hexR = r.toString(16).padStart(2, '0');
        const hexG = g.toString(16).padStart(2, '0');
        const hexB = b.toString(16).padStart(2, '0');
        return `#${hexR}${hexG}${hexB}`.toUpperCase();
    }

    applyNewColor() {
        this.generateNewColor(); // Generate new color first
        if (this.color) {
            this.currentColor = this.color;
            this.undoStack.push(this.currentColor);
            this.clickCount.value++;
            this.updateSquare();
            this.updateLists();
        }
    }

    applyUndoStack() {
        if (this.undoStack.length > 0) {
            this.redoStack.push(this.currentColor);
            this.currentColor = this.undoStack.pop();
            this.updateSquare();
            this.updateLists();
        }
    }

    applyRedoStack() {
        if (this.redoStack.length > 0) {
            this.undoStack.push(this.currentColor);
            this.currentColor = this.redoStack.pop();
            this.updateSquare();
            this.updateLists();
        }
    }

    reset() {
        this.undoStack = [];
        this.redoStack = [];
        this.currentColor = null;
        this.color = null;
        this.clickCount = {
			value: 0,
			color: {
				r: 0,
				g: 0,
				b: 0
			},
			hex: ''
		};
        this.updateSquare();
        this.updateLists();
    }
}

const ColorContainerClient = new ColorContainer();