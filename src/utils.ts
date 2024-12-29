// curveHandler.js
export const handleCurve = (
  value,
  setCurveDegree,
  setDotGroups,
  selectedGroup
) => {
  const newCurveDegree = parseInt(value);
  setCurveDegree(newCurveDegree);

  setDotGroups((prev) =>
    prev.map((group) =>
      group.id === selectedGroup ? { ...group, curve: newCurveDegree } : group
    )
  );
};

// stretchHandler.js

// dotDeletionHandler.js
export const deleteDots = (selection, setDotGroups) => {
  setDotGroups((prev) =>
    prev
      .map((group) => ({
        ...group,
        dots: group.dots.filter(
          (dot) =>
            !(
              dot.cx >= selection.x &&
              dot.cx <= selection.x + selection.width &&
              dot.cy >= selection.y &&
              dot.cy <= selection.y + selection.height
            )
        ),
      }))
      .filter((group) => group.dots.length > 0)
  );
};


// stretchHandler.js
export const handleStretch = (value, setStretchFactor, setDotGroups, selectedGroup, baseDotSpacing) => {
  const newStretchFactor = parseFloat(value);
  setStretchFactor(newStretchFactor);

  setDotGroups((prev) =>
    prev.map((group) => {
      if (group.id !== selectedGroup) return group;

      const spacing = baseDotSpacing * newStretchFactor;

      // Update the bounds of the group to reflect the stretched size
      const newWidth = (group.columns - 1) * spacing;
      const newHeight = (group.dots.length / group.columns) * spacing;

      // Update the dots with new stretched positions
      const dots = group.dots.map((dot) => {
        const relativeX = dot.cx - group.bounds.x;
        const normalizedX = relativeX / (baseDotSpacing * (group.stretchFactor || 1));

        return {
          ...dot,
          cx: group.bounds.x + normalizedX * spacing,
          cy: group.bounds.y + dot.row * spacing,
        };
      });

      const labels = group.labels.map((label, rowIndex) => ({
        ...label,
        y: group.bounds.y + rowIndex * spacing,
      }));

      return {
        ...group,
        dots: dots,
        labels: labels,
        stretchFactor: newStretchFactor,
        bounds: {
          ...group.bounds,
          width: newWidth,
          height: newHeight,
        },
      };
    })
  );
};


export const isPointInRotatedRect = (point, rect, angle) => {
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;
  const translatedX = point[0] - centerX;
  const translatedY = point[1] - centerY;
  const angleRad = (angle * Math.PI) / 180;
  const rotatedX = translatedX * Math.cos(angleRad) + translatedY * Math.sin(angleRad);
  const rotatedY = -translatedX * Math.sin(angleRad) + translatedY * Math.cos(angleRad);
  return (
    rotatedX + centerX >= rect.x &&
    rotatedX + centerX <= rect.x + rect.width &&
    rotatedY + centerY >= rect.y &&
    rotatedY + centerY <= rect.y + rect.height
  );
};


// rotationHandler.js
export const handleRotate = (selectedGroup, rotationDegree, setDotGroups) => {
  if (selectedGroup === null) return;

  setDotGroups((prev) =>
    prev.map((group) =>
      group.id === selectedGroup
        ? { ...group, rotation: parseInt(rotationDegree) || 0 }
        : group
    )
  );
};




// alignmentHandler.js
export const alignSelected = (alignment, selectedGroup, setDotGroups, baseDotSpacing) => {
  if (selectedGroup === null) return;

  setDotGroups((prev) =>
    prev.map((group) => {
      if (group.id !== selectedGroup) return group;

      const dots = [...group.dots];
      const bounds = group.bounds;
      const spacing = baseDotSpacing * (group.stretchFactor || 1);

      // Group dots by row
      const rowGroups = {};
      dots.forEach((dot) => {
        if (!rowGroups[dot.row]) rowGroups[dot.row] = [];
        rowGroups[dot.row].push(dot);
      });

      const newDots = [];
      Object.entries(rowGroups).forEach(([row, rowDots]) => {
        const sortedDots = rowDots.sort((a, b) => a.col - b.col);
        const rowWidth = (sortedDots.length - 1) * spacing;

        sortedDots.forEach((dot, index) => {
          let newX;
          switch (alignment) {
            case "center":
              newX = bounds.x + (bounds.width / 2) - (rowWidth / 2) + (index * spacing);
              break;
            case "right":
              newX = bounds.x + bounds.width - rowWidth + (index * spacing);
              break;
            default:
              newX = bounds.x + (index * spacing);
          }

          newDots.push({
            ...dot,
            cx: newX,
            cy: bounds.y + (parseInt(row) * spacing),
            originalCol: index
          });
        });
      });

      return {
        ...group,
        dots: newDots,
        alignment: alignment
      };
    })
  );
};






// dotGenerationHandler.js
export const generateDots = (selection, rowCount, colCount, baseDotSpacing, stretchFactor, setDotGroups, setCurrentGroupId,currentGroupId) => {
  const generatedDots = [];
  const rowLabels = [];

  // Apply stretch factor immediately when generating dots
  const stretchedSpacing = baseDotSpacing * stretchFactor;

  // Loop through rows and columns
  for (let i = 0; i < rowCount; i++) {
    for (let j = 0; j < colCount; j++) {
      generatedDots.push({
        cx: selection.x + j * stretchedSpacing,
        cy: selection.y + i * stretchedSpacing,
        row: i,
        col: j
      });
    }

    rowLabels.push({
      label: `Row ${i + 1}`,
      x: selection.x - 40,
      y: selection.y + i * stretchedSpacing,
    });
  }

  // Update the group's bounds with the stretched width and height
  const newWidth = (colCount - 1) * stretchedSpacing;
  const newHeight = (rowCount - 1) * stretchedSpacing;

  // Set the new dot group with the updated stretch factor
  setDotGroups((prev) => [
    ...prev,
    {
      id: currentGroupId,
      dots: generatedDots,
      labels: rowLabels,
      bounds: {
        x: selection.x,
        y: selection.y,
        width: newWidth,
        height: newHeight,
      },
      rotation: 0,
      stretchFactor: stretchFactor,  // Apply stretch factor to the group
      columns: colCount
    },
  ]);
  setCurrentGroupId((prev) => prev + 1);

};
