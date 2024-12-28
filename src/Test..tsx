import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";

const InteractiveD3ChartWithNumbers = () => {
  const svgRef = useRef();
  const [dotGroups, setDotGroups] = useState([]);
  const [mode, setMode] = useState("add");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [currentGroupId, setCurrentGroupId] = useState(0);
  const [rotationDegree, setRotationDegree] = useState(0);
  const [stretchFactor, setStretchFactor] = useState(1);
  const [curveDegree, setCurveDegree] = useState(0);
  console.log(dotGroups);





  const baseDotSpacing = 30;

  const isPointInRotatedRect = (point, rect, angle) => {
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

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg
      .attr("width", 800)
      .attr("height", 400)
      .style("background", "#e9f5ff")
      .style("cursor", mode === "select" ? "pointer" : "crosshair");

    svg.selectAll("*").remove();

    let selection = null;

    const dragBehavior = d3
      .drag()
      .on("start", (event) => {
        if (mode === "select") return;

        const [x, y] = d3.pointer(event);

        // Initialize selection with small default width and height (e.g., 1x1)
        selection = { x, y, width: 1, height: 1 };

        svg.append("rect").attr("class", "selection");
        svg.append("text").attr("class", "dimension-text");
      })
      .on("drag", (event) => {
        if (mode === "select") return;

        const [x, y] = d3.pointer(event);

        // Update width and height based on drag position
        selection.width = Math.abs(x - selection.x);
        selection.height = Math.abs(y - selection.y);

        // Correct the position based on the drag direction
        selection.x = x < selection.x ? x : selection.x;
        selection.y = y < selection.y ? y : selection.y;

        // Update the selection box
        console.log(selection, "selection is ");

        svg
          .select(".selection")
          .attr("x", selection.x)
          .attr("y", selection.y)
          .attr("width", selection.width)
          .attr("height", selection.height)
          .style("fill", "rgba(100, 150, 255, 0.3)");

        // Update the dimension text
        const rowCount = Math.floor(selection.height / baseDotSpacing);
        const colCount = Math.floor(selection.width / baseDotSpacing);

        svg
          .select(".dimension-text")
          .attr("x", selection.x + selection.width / 2)
          .attr("y", selection.y + selection.height / 2)
          .text(`${colCount}x${rowCount}`);
      })
      .on("end", () => {
        if (mode === "select" || !selection) return;

        if (mode === "add") {
          const rowCount = Math.floor(selection.height / baseDotSpacing);
          const colCount = Math.floor(selection.width / baseDotSpacing);
          generateDots(selection, rowCount, colCount);
        } else if (mode === "delete") {
          deleteDots(selection);
        }

        svg.select(".selection").remove();
        svg.select(".dimension-text").remove();
        selection = null;
      });

    svg.call(dragBehavior);


    svg.on("click", (event) => {
      if (mode !== "select") return;

      const [x, y] = d3.pointer(event);
      const clickedGroup = dotGroups.find((group) =>
        isPointInRotatedRect([x, y], group.bounds, group.rotation || 0)
      );

      if (clickedGroup) {
        setSelectedGroup(clickedGroup.id);
        setRotationDegree(clickedGroup.rotation || 0);
        setStretchFactor(clickedGroup.stretchFactor || 1);
      } else {
        setSelectedGroup(null);
      }
    });

    dotGroups.forEach((group) => {
      const isSelected = group.id === selectedGroup;
      const rotation = group.rotation || 0;
      const spacing = baseDotSpacing * (group.stretchFactor || 1);
      const curve = group.curve || 0;

      // Calculate center point of the group
      const centerX = group.bounds.x + group.bounds.width / 2;
      const centerY = group.bounds.y + group.bounds.height / 2;

      // Create a group element for the entire dot group
      const groupElement = svg
        .append("g")
        .attr("class", `dot-group-${group.id}`)
        .attr("transform", `rotate(${rotation}, ${centerX}, ${centerY})`);

      if (isSelected) {
        groupElement
          .append("rect")
          .attr("x", group.bounds.x)
          .attr("y", group.bounds.y)
          .attr("width", group.bounds.width)
          .attr("height", group.bounds.height)
          .attr("fill", "none")
          .attr("stroke", "#2196f3")
          .attr("stroke-width", 2);
      }

      // Apply theater-style curve transformation to dots
      group.dots.forEach((d, i) => {
        const rowProgress = d.row / (group.bounds.height / spacing);
        const colProgress = (d.cx - group.bounds.x) / group.bounds.width - 0.5; // -0.5 to 0.5

        // Calculate curve offset based on both row and column position
        const curveOffset = Math.pow(colProgress * 2, 2) * curve * rowProgress;

        const curvedX = d.cx;
        const curvedY = d.cy + curveOffset;

        groupElement
          .append("circle")
          .attr("cx", curvedX)
          .attr("cy", curvedY)
          .attr("r", 10)
          .attr("fill", isSelected ? "#2196f3" : "#4caf50");

        groupElement
          .append("text")
          .attr("x", curvedX)
          .attr("y", curvedY + 4)
          .text(i + 1)
          .style("fill", "#fff")
          .style("font-size", "10px")
          .style("text-anchor", "middle");
      });

      // Update labels position with curve
      group.labels.forEach((label) => {
        const rowIndex = parseInt(label.label.split(" ")[1]) - 1;
        const rowProgress = rowIndex / (group.bounds.height / spacing);
        const colProgress = -0.5; // Labels are on the left side
        const curveOffset = Math.pow(colProgress * 2, 2) * curve * rowProgress;

        groupElement
          .append("text")
          .attr("x", label.x)
          .attr("y", label.y + curveOffset)
          .text(label.label)
          .style("fill", "#333")
          .style("font-size", "12px")
          .style("font-weight", "bold")
          .style("text-anchor", "end");
      });
    });
  }, [dotGroups, mode, selectedGroup]);

  const generateDots = (selection, rowCount, colCount) => {
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


  const deleteDots = (selection) => {
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
  const handleRotate = () => {
    if (selectedGroup === null) return;

    setDotGroups((prev) =>
      prev.map((group) =>
        group.id === selectedGroup
          ? { ...group, rotation: parseInt(rotationDegree) || 0 }
          : group
      )
    );
  };
  const alignSelected = (alignment) => {
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

  const handleStretch = (value) => {
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



  const handleCurve = (value) => {
    const newCurveDegree = parseInt(value);
    setCurveDegree(newCurveDegree);

    setDotGroups((prev) =>
      prev.map((group) =>
        group.id === selectedGroup
          ? { ...group, curve: newCurveDegree }
          : group
      )
    );
  };



  return (
    <div className="w-full max-w-4xl">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => {
            setMode("add");
            setSelectedGroup(null);
          }}
          className={`px-4 py-2 text-white ${mode === "add" ? "bg-green-500" : "bg-gray-400"}`}
        >
          Add
        </button>
        <button
          onClick={() => {
            setMode("select");
            setSelectedGroup(null);
          }}
          className={`px-4 py-2 text-white ${mode === "select" ? "bg-blue-500" : "bg-gray-400"}`}
        >
          Select
        </button>
        <button
          onClick={() => {
            setMode("delete");
            setSelectedGroup(null);
          }}
          className={`px-4 py-2 text-white ${mode === "delete" ? "bg-red-500" : "bg-gray-400"}`}
        >
          Delete
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => alignSelected("left")}
          className={`px-4 py-2 text-white ${selectedGroup !== null ? "bg-blue-500" : "bg-gray-400"}`}
          disabled={selectedGroup === null}
        >
          Left Align
        </button>
        <button
          onClick={() => alignSelected("center")}
          className={`px-4 py-2 text-white ${selectedGroup !== null ? "bg-blue-500" : "bg-gray-400"}`}
          disabled={selectedGroup === null}
        >
          Center Align
        </button>
        <button
          onClick={() => alignSelected("right")}
          className={`px-4 py-2 text-white ${selectedGroup !== null ? "bg-blue-500" : "bg-gray-400"}`}
          disabled={selectedGroup === null}
        >
          Right Align
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          type="number"
          value={rotationDegree}
          onChange={(e) => setRotationDegree(e.target.value)}
          placeholder="Enter rotation degree"
          className="px-4 py-2 border rounded"
          disabled={selectedGroup === null}
        />
        <button
          onClick={handleRotate}
          className={`px-4 py-2 text-white ${selectedGroup !== null ? "bg-purple-500" : "bg-gray-400"}`}
          disabled={selectedGroup === null}
        >
          Rotate
        </button>
      </div>

      <div className="flex gap-2 mb-4 items-center">
        <span className="text-sm font-medium">Stretch:</span>
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={stretchFactor}
          onChange={(e) => handleStretch(e.target.value)}
          className="w-48"
          disabled={selectedGroup === null}
        />
        <span className="text-sm">{stretchFactor.toFixed(1)}x</span>
      </div>

      <div className="flex gap-2 mb-4 items-center">
        <span className="text-sm font-medium">Curve:</span>
        <input
          type="range"
          min="0"
          max="200"
          value={curveDegree}
          onChange={(e) => handleCurve(e.target.value)}
          className="w-48"
          disabled={selectedGroup === null}
        />
        <span className="text-sm">{curveDegree}</span>
      </div>

      <svg ref={svgRef}></svg>
    </div>
  );
};

export default InteractiveD3ChartWithNumbers;