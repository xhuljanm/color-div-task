class ColorContainer {
    constructor() {
        this.document = document;
        this.currentColor = '#FFFFFF';
        this.color = null;
        this.clickCountColor = null;
		this.draggedData = null;
        this.draggedElement = null;
        this.dragStartPosition = null;
        this.dragSourceList = null; // Track source list
        this.dragSourceIndex = null; // Track original index
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

		this.overlay = this.document.getElementById('overlay');
        this.undoListDiv = this.document.getElementById('undoList');
        this.redoListDiv = this.document.getElementById('redoList');
		this.undoListContainer = this.document.getElementById('undoListContainer');
		this.redoListContainer = this.document.getElementById('redoListContainer');

        this.placeholder = document.createElement('li');
        this.placeholder.classList.add('placeholder');
        this.placeholder.style.opacity = '0.5';
        this.placeholder.style.height = '15px';
        this.placeholder.style.width = '15px';
        this.placeholder.style.margin = '2px';
        this.placeholder.style.position = 'absolute';
        this.placeholder.style.pointerEvents = 'none';

        // Button event listeners
        this.document.getElementById('colorButton').onclick = () => this.applyNewColor();
        this.document.getElementById('undoButton').onclick = () => this.applyUndoStack();
        this.document.getElementById('redoButton').onclick = () => this.applyRedoStack();
		this.document.getElementById('showUndoButton').onclick = () => this.toggleList('undo');
        this.document.getElementById('showRedoButton').onclick = () => this.toggleList('redo');

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
		const isUndoVisible = this.undoListContainer.style.display === 'flex';
		const isRedoVisible = this.redoListContainer.style.display === 'flex';

		if (type === 'undo') {
			if (isUndoVisible) { // Toggle Undo List
				this.undoListContainer.style.display = 'none';
				this.document.getElementById('showUndoButton').innerText = 'Show Undo List';
			} else {
				this.overlay.style.display = 'flex';
				this.undoListContainer.style.display = 'flex';
				this.redoListContainer.style.display = 'none'; // Hide Redo List
				this.document.getElementById('showUndoButton').innerText = 'Hide Undo List';
				this.document.getElementById('showRedoButton').innerText = 'Show Redo List'; // Reset redo button text
			}
		} else if (type === 'redo') { // Toggle Redo List
			if (isRedoVisible) {
				this.redoListContainer.style.display = 'none';
				this.document.getElementById('showRedoButton').innerText = 'Show Redo List';
			} else {
				this.overlay.style.display = 'flex';
				this.redoListContainer.style.display = 'flex';
				this.undoListContainer.style.display = 'none'; // Hide Undo List
				this.document.getElementById('showRedoButton').innerText = 'Hide Redo List';
				this.document.getElementById('showUndoButton').innerText = 'Show Undo List'; // Reset undo button text
			}
		}

		// if both hidden, hide overlay
		if (this.undoListContainer.style.display === 'none' && this.redoListContainer.style.display === 'none') this.overlay.style.display = 'none';
	}

    initDragAndDrop() {
        this.setupDragAndDrop(this.undoListDiv, 'undo');
        this.setupDragAndDrop(this.redoListDiv, 'redo');
    }

    setupDragAndDrop(container, listType) {
        const squares = container.children;

        for (let square of squares) {
            square.draggable = true;
            square.ondragstart = (event) => {
                const index = Array.from(container.children).indexOf(square);
                this.draggedData = `${index}-${listType}`;
                this.draggedElement = square;
                this.dragSourceList = listType;
                this.dragSourceIndex = index;
                this.dragStartPosition = {
                    parent: container,
                    nextSibling: square.nextSibling
                };
                event.dataTransfer.setData('text/plain', this.draggedData);
                square.style.opacity = '0.4';
            };

            square.ondragend = () => {
				if (this.draggedElement) {
                    this.draggedElement.style.position = '';
                    this.draggedElement.style.opacity = '1';
                    this.draggedElement.classList.remove('dragging');
                }

                this.draggedElement = null;
				this.dragStartPosition = null;
				this.dragSourceList = null;
				this.dragSourceIndex = null;
				this.placeholder.remove();
            };

            square.ondragover = (event) => {
                event.preventDefault();
                const rect = square.getBoundingClientRect();
                const mouseX = event.clientX;

                // Remove existing placeholder
                const existingPlaceholder = document.querySelector('.placeholder');
                if (existingPlaceholder) existingPlaceholder.remove();

                // Create new placeholder
                const placeholder = this.placeholder.cloneNode(true);
                placeholder.style.backgroundColor = this.draggedElement.style.backgroundColor;

                // Check if mouse is between elements
                if (mouseX < rect.left + rect.width / 2 + Math.floor(mouseX * 0.01)) { // added 1% of the mouseX for mouse precision hovering
                    square.parentNode.insertBefore(placeholder, square);
                    if (this.draggedElement) square.parentNode.insertBefore(this.draggedElement, square);
                } else {
                    square.parentNode.insertBefore(placeholder, square.nextSibling);
                    if (this.draggedElement) square.parentNode.insertBefore(this.draggedElement, square.nextSibling);
                }
            };

            // Touch events for mobile
            square.addEventListener('touchstart', (event) => {
                const index = Array.from(container.children).indexOf(square);

                this.draggedData = `${index}-${listType}`;
                this.draggedElement = square;
                this.dragSourceList = listType;
                this.dragSourceIndex = index;
                this.dragStartPosition = {
                    parent: container,
                    nextSibling: square.nextSibling
                };

                event.stopPropagation();
                square.classList.add('dragging');
                square.style.opacity = '0.4';
            });

            square.addEventListener('touchmove', (event) => {
                const touch = event.touches[0];

                if (this.draggedElement) {
                    this.draggedElement.style.position = 'absolute';
                    this.draggedElement.style.left = `${touch.clientX}px`;
                    this.draggedElement.style.top = `${touch.clientY}px`;
                }

                event.preventDefault();

                const elemBelow = document.elementFromPoint(touch.clientX, touch.clientY); // Find element under touch point

                if (elemBelow && elemBelow.tagName === 'LI') {
                    const rect = elemBelow.getBoundingClientRect();

                    // Remove existing placeholder
                    const existingPlaceholder = document.querySelector('.placeholder');
                    if (existingPlaceholder) existingPlaceholder.remove();

                    // Create new placeholder
                    const placeholder = this.placeholder.cloneNode(true);
                    placeholder.style.backgroundColor = this.draggedElement.style.backgroundColor;

					if (touch.clientX < rect.left + rect.width / 2) {
                        elemBelow.parentNode.insertBefore(placeholder, elemBelow);
                        if (this.draggedElement) elemBelow.parentNode.insertBefore(this.draggedElement, elemBelow);
                    } else {
                        elemBelow.parentNode.insertBefore(placeholder, elemBelow.nextSibling);
                        if (this.draggedElement) elemBelow.parentNode.insertBefore(this.draggedElement, elemBelow.nextSibling);
                    }
                }
            });

            square.addEventListener('touchend', (event) => {
				const target = document.elementFromPoint(event.changedTouches[0].clientX, event.changedTouches[0].clientY);

                if (window.innerWidth <= 768) {
					const isRedoList = target && target.id === 'redoList';

					if (isRedoList || (!target || (!target.id.includes('undo') && !target.id.includes('redo')))) {
						const color = this.dragSourceList === 'undo'
						? this.undoStack.splice(this.dragSourceIndex, 1)[0] // Remove from undo
						: this.redoStack.splice(this.dragSourceIndex, 1)[0]; // Remove from redo

						if (this.dragSourceList === 'undo') this.redoStack.push(color); // Add to redo
						else this.undoStack.push(color); // Add to undo

						this.currentColor = this.undoStack.length > 0 ? this.undoStack[this.undoStack.length - 1] : '#FFFFFF';
						this.updateLists();
						this.updateSquare();
					} else {
						this.handleDrop(event, target);
					}
				} else {
					if (!target || (!target.id.includes('undo') && !target.id.includes('redo'))) {
						if (this.dragStartPosition) {
							this.dragStartPosition.parent.insertBefore( // Return to original position if dropped outside valid target
								this.draggedElement,
								this.dragStartPosition.nextSibling
							);
						}
					} else {
						this.handleDrop(event, target);
					}
				}

                if (this.draggedElement) {
                    this.draggedElement.style.position = '';
                    this.draggedElement.style.opacity = '1';
                    this.draggedElement.classList.remove('dragging');
                }

                this.draggedElement = null;
                this.dragStartPosition = null;
                this.draggedData = null;
                this.dragSourceList = null;
                this.dragSourceIndex = null;
                this.placeholder.remove();
            });
        }

        container.ondragover = (event) => {
            event.preventDefault();

            if (container.children.length === 0) {
                const placeholder = this.placeholder.cloneNode(true);
                placeholder.style.backgroundColor = this.draggedElement.style.backgroundColor;
                container.appendChild(placeholder);

                if (this.draggedElement) container.appendChild(this.draggedElement); // Move dragged element to preview position
            }
        };

        container.ondragleave = (event) => {
            if (event.relatedTarget && !container.contains(event.relatedTarget)) {
                const placeholder = container.querySelector('.placeholder');
                if (placeholder) placeholder.remove();

                if (this.draggedElement && this.dragStartPosition) { // Return dragged element to original position
                    this.dragStartPosition.parent.insertBefore(
                        this.draggedElement,
                        this.dragStartPosition.nextSibling
                    );
                }
            }
        };

        container.ondrop = (event) => {
            event.preventDefault();
            const placeholder = container.querySelector('.placeholder');
            const dropIndex = placeholder ? Array.from(container.children).indexOf(placeholder) : -1;

            if (!this.draggedData || !this.dragSourceList || this.dragSourceIndex === null) return;

            const targetList = container.id.includes('undo') ? 'undo' : 'redo';
            const sourceStack = this.dragSourceList === 'undo' ? this.undoStack : this.redoStack;
            const targetStack = targetList === 'undo' ? this.undoStack : this.redoStack;

            const color = sourceStack.splice(this.dragSourceIndex, 1)[0]; // Remove from source

            const insertIndex = dropIndex === -1 ? targetStack.length : dropIndex; // Add to target only if not already in source stack

            if (targetList !== this.dragSourceList) targetStack.splice(insertIndex, 0, color);
            else targetStack.splice(insertIndex, 0, color); // If same list, just reorder

            if (this.undoStack.length > 0) this.currentColor = this.undoStack[this.undoStack.length - 1]; // Update current color based on the last color in undoStack

            if (placeholder) placeholder.remove();
            this.updateLists();
            this.updateSquare();
        };
    }

    handleDrop(event, target = null) {
        event.preventDefault();

        if (!this.draggedData || !this.dragSourceList || this.dragSourceIndex === null) return;

        const placeholder = document.querySelector('.placeholder');
        const dropIndex = placeholder ? Array.from(placeholder.parentNode.children).indexOf(placeholder) : -1;

        if (!target) {
            const dropPoint = event.changedTouches ? event.changedTouches[0] : event;
            target = document.elementFromPoint(dropPoint.clientX, dropPoint.clientY);
        }

        if (!target) {
            if (this.dragStartPosition) {
                this.dragStartPosition.parent.insertBefore( // Return to original position if no valid target
                    this.draggedElement,
                    this.dragStartPosition.nextSibling
                );
            }
            return;
        }

        const targetList = target.id.includes('undo') ? 'undo' : target.id.includes('redo') ? 'redo' : null;

        if (!targetList) {
            if (this.dragStartPosition) {
                this.dragStartPosition.parent.insertBefore( // Return to original position if invalid target
                    this.draggedElement,
                    this.dragStartPosition.nextSibling
                );
            }
            return;
        }

        const sourceStack = this.dragSourceList === 'undo' ? this.undoStack : this.redoStack;
        const targetStack = targetList === 'undo' ? this.undoStack : this.redoStack;

        const color = sourceStack.splice(this.dragSourceIndex, 1)[0]; // Remove from source

        // Add to target only if not already in source stack
        const insertIndex = dropIndex === -1 ? targetStack.length : dropIndex;
        if (targetList !== this.dragSourceList) targetStack.splice(insertIndex, 0, color);
        else targetStack.splice(insertIndex, 0, color); // If same list, just reorder

        // Update current color based on the last color in undoStack
        if (this.undoStack.length > 0) this.currentColor = this.undoStack[this.undoStack.length - 1];

		if (placeholder) placeholder.remove();
        this.updateLists();
        this.updateSquare();
    }

    generateNewColor() {
		let r, g, b;

        while (true) {
            r = Math.floor(Math.random() * 256);
            g = Math.floor(Math.random() * 256);
            b = Math.floor(Math.random() * 256);

            if (!this.isGray(r, g, b) && !this.isTooBright(r, g, b) && !this.isTooDark(r, g, b)) break;
        }

        this.color = this.rgbToHex(r, g, b);
    }

	updateClickCountColor() {
		const hexColor = this.currentColor.replace('#', '');
		const r = parseInt(hexColor.substring(0, 2), 16);
		const g = parseInt(hexColor.substring(2, 4), 16);
		const b = parseInt(hexColor.substring(4, 6), 16);

		this.clickCount.color.r = 255 - r;
		this.clickCount.color.g = 255 - g;
		this.clickCount.color.b = 255 - b;

		this.clickCount.hex = this.rgbToHex(this.clickCount.color.r, this.clickCount.color.g, this.clickCount.color.b);
	}

    rgbToHex(r, g, b) {
        const hexR = r.toString(16).padStart(2, '0');
        const hexG = g.toString(16).padStart(2, '0');
        const hexB = b.toString(16).padStart(2, '0');
        return `#${hexR}${hexG}${hexB}`.toUpperCase();
    }

    applyNewColor() {
		this.generateNewColor();

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
			const lastColor = this.undoStack.pop();
			this.redoStack.push(this.currentColor);
			this.currentColor = lastColor;

			this.updateClickCountColor();
			this.updateSquare();
			this.updateLists();
		}
	}

	applyRedoStack() {
		if (this.redoStack.length > 0) {
			const nextColor = this.redoStack.pop();
			this.undoStack.push(this.currentColor);
			this.currentColor = nextColor;

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