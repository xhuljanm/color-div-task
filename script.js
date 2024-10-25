class ColorContainer {
    constructor() {
        this.document = document;
        this.currentColor = '#FFFFFF';
        this.color = null;
        this.clickCountColor = null;
		this.draggedData = null;
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
		this.undoListDiv.innerHTML = '';
		this.redoListDiv.innerHTML = '';

        this.undoStack.forEach((color, index) => {
			const li = document.createElement('li');
			li.id = `undo-${index}`;
			li.draggable = true;
			li.style.backgroundColor = color;
			li.ondragstart = (event) => event.dataTransfer.setData('text/plain', `${index}-undo`);

			this.undoListDiv.appendChild(li);
		});

		this.redoStack.forEach((color, index) => {
			const li = document.createElement('li');
			li.id = `redo-${index}`;
			li.draggable = true;
			li.style.backgroundColor = color;
			li.ondragstart = (event) => event.dataTransfer.setData('text/plain', `${index}-redo`);

			this.redoListDiv.appendChild(li);
		});

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
        this.setupDragAndDrop(this.undoListDiv, 'undo');
        this.setupDragAndDrop(this.redoListDiv, 'redo');
    }

    setupDragAndDrop(container, listType) {
        const squares = container.children;

        for (let square of squares) {
            square.draggable = true; // Make each square draggable
            square.ondragstart = (event) => {
                const index = Array.from(container.children).indexOf(square);
                this.draggedData = `${index}-${listType}`; // Store dragged data
                event.dataTransfer.setData('text/plain', this.draggedData); // Use dataTransfer
            };

            // Touch events for mobile
            square.addEventListener('touchstart', (event) => {
                const index = Array.from(container.children).indexOf(square);
                this.draggedData = `${index}-${listType}`;
                event.stopPropagation(); // Prevent any unintended interactions
                square.classList.add('dragging'); // Optional class to indicate dragging
            });

            square.addEventListener('touchmove', (event) => {
                const touch = event.touches[0];
                square.style.position = 'absolute';
                square.style.left = `${touch.clientX}px`;
                square.style.top = `${touch.clientY}px`;
                event.preventDefault();
            });

            square.addEventListener('touchend', (event) => {
				const target = document.elementFromPoint(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
				this.handleDrop(event, target); // Pass the target found
				// Reset position and remove dragging class
				const draggedElement = document.querySelector('.dragging');
				if (draggedElement) {
					draggedElement.style.position = '';
					draggedElement.classList.remove('dragging');
				}
				this.draggedData = null; // Reset dragged data
			});

        }

        container.ondragover = (event) => event.preventDefault();
        container.ondrop = (event) => this.handleDrop(event, container, listType);
    }

    handleDrop(event, target = null) {
		event.preventDefault();

		if (!this.draggedData) return;

		const [draggedIndex, sourceList] = this.draggedData.split('-');

		// Determine the actual target if not provided
		if (!target) {
			const dropPoint = event.changedTouches ? event.changedTouches[0] : event;
			target = document.elementFromPoint(dropPoint.clientX, dropPoint.clientY);
		}

		if (sourceList === 'undo') {
			const color = this.undoStack.splice(draggedIndex, 1)[0];

			if (target && target.id.includes('undo')) {
				const targetIndex = target.id.split('-')[1];
				this.undoStack.splice(targetIndex, 0, color);
			} else if (target && target.id.includes('redo')) {
				this.redoStack.push(color);
			}
		} else if (sourceList === 'redo') {
			const color = this.redoStack.splice(draggedIndex, 1)[0];

			if (target && target.id.includes('redo')) {
				const targetIndex = target.id.split('-')[1];
				this.redoStack.splice(targetIndex, 0, color);
			} else if (target && target.id.includes('undo')) {
				this.undoStack.push(color);
			}
		}

		this.updateLists();
		this.updateSquare();
	}

    generateNewColor() {
		let r, g, b;

        while (true) { // Generate random RGB values
            r = Math.floor(Math.random() * 256);
            g = Math.floor(Math.random() * 256);
            b = Math.floor(Math.random() * 256);

            if (!this.isGray(r, g, b) && !this.isTooBright(r, g, b) && !this.isTooDark(r, g, b)) break; // Exit loop if valid color
        }

        this.color = this.rgbToHex(r, g, b); // Convert RGB to Hex
    }

	updateClickCountColor() {
		const hexColor = this.currentColor.replace('#', ''); // Remove the '#' from hex
		const r = parseInt(hexColor.substring(0, 2), 16);
		const g = parseInt(hexColor.substring(2, 4), 16);
		const b = parseInt(hexColor.substring(4, 6), 16);

		// Invert the color
		this.clickCount.color.r = 255 - r;
		this.clickCount.color.g = 255 - g;
		this.clickCount.color.b = 255 - b;

		// Update hex representation
		this.clickCount.hex = this.rgbToHex(this.clickCount.color.r, this.clickCount.color.g, this.clickCount.color.b);
	}

    rgbToHex(r, g, b) {
        const hexR = r.toString(16).padStart(2, '0');
        const hexG = g.toString(16).padStart(2, '0');
        const hexB = b.toString(16).padStart(2, '0');
        return `#${hexR}${hexG}${hexB}`.toUpperCase();
    }

    applyNewColor() {
		this.generateNewColor(); // Generate the new color first

		if (this.redoStack.length > 0) this.redoStack = [];
		this.undoStack.push(this.currentColor);

		if (this.color) {
			this.currentColor = this.color;
			this.clickCount.value++;
			this.updateClickCountColor();
			this.updateSquare();
			this.updateLists();
		}
	}

    applyUndoStack() {
		if (this.undoStack.length > 0) {
			this.color = this.undoStack.pop();
			this.currentColor = this.color;
			this.redoStack.push(this.currentColor);

			this.clickCount.value++;
			this.updateClickCountColor();
			this.updateSquare();
			this.updateLists();
		}
	}

	applyRedoStack() {
		if (this.redoStack.length > 0) {
			this.color = this.redoStack.pop();
			this.currentColor = this.color;
			this.undoStack.push(this.currentColor);

			this.clickCount.value++;
			this.updateClickCountColor();
			this.updateSquare();
			this.updateLists();
		}
	}


    reset() {
        this.undoStack = [];
        this.redoStack = [];
        this.currentColor = '#FFFFFF';
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