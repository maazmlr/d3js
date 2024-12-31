import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import {
  alignSelected,
  deleteDots,
  handleRotate,
  handleStretch,
  isPointInRotatedRect,
} from "./utils";

const InteractiveD3ChartWithNumbers = () => {
  const svgRef = useRef();
  const [dotGroups, setDotGroups] = useState([]);
  const [mode, setMode] = useState("add");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [currentGroupId, setCurrentGroupId] = useState(0);
  const [rotationDegree, setRotationDegree] = useState(0);
  const [stretchFactor, setStretchFactor] = useState(1);
  const [curveIntensity, setCurveIntensity] = useState(0);

  console.log(dotGroups);

  const baseDotSpacing = 30;

  const handleCurveChange = (event) => {
    const intensity = parseFloat(event);
    setCurveIntensity(intensity);

    if (selectedGroup !== null) {
      setDotGroups((prevGroups) => {
        return prevGroups.map((group) => {
          if (group.id === selectedGroup) {
            const updatedDots = group.dots.map((dot) => {
              // Calculate position in curve using quadratic function
              const normalizedX = (dot.col / (group.columns - 1)) * 2 - 1;
              const curveOffset = intensity * (normalizedX * normalizedX);

              return {
                ...dot,
                cy: dot.originalY + curveOffset * baseDotSpacing, // Adjust y-coordinate for curve
              };
            });

            // Update the labels to follow the first column dots
            const updatedLabels = group.labels.map((label, rowIndex) => {
              const col1Dot = updatedDots.find((dot) => dot.row === rowIndex && dot.col === 0);
              return {
                ...label,
                y: col1Dot ? col1Dot.cy : label.y, // Bind label y-coordinate to column 1 dot's y-coordinate
              };
            });

            return { ...group, dots: updatedDots, labels: updatedLabels, curveIntensity: intensity };
          }
          return group;
        });
      });
    }
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
          handleGenerateDots(selection, rowCount, colCount);
        } else if (mode === "delete") {
          deleteDots(selection, setDotGroups);
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
      const rotation = group.rightVenue
        ? -10 // Apply -10° if rightVenue is true
        : group.leftVenue
          ? 190 // Apply 180° if leftVenue is true
          : group.rotation || 0; // Default rotation
      const spacing = baseDotSpacing * (group.stretchFactor || 1);

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

      group.dots.forEach((d, i) => {
        groupElement
          .append("circle")
          .attr("cx", d.cx)
          .attr("cy", d.cy)
          .attr("r", 10)
          .attr("fill", isSelected ? "#2196f3" : "#4caf50");

        groupElement
          .append("text")
          .attr("x", d.cx)
          .attr("y", d.cy + 4)
          .text(i + 1)
          .style("fill", "#fff")
          .style("font-size", "10px")
          .style("text-anchor", "middle");
      });

      // Update labels position
      group.labels.forEach((label) => {
        groupElement
          .append("text")
          .attr("x", label.x)
          .attr("y", label.y)
          .text(label.label)
          .style("fill", "#333")
          .style("font-size", "12px")
          .style("font-weight", "bold")
          .style("text-anchor", "end");
      });
    });
  }, [dotGroups, mode, selectedGroup]);

  const handleGenerateDots = (selection, rowCount, colCount) => {
    generateDots(
      selection,
      rowCount,
      colCount,
      baseDotSpacing,
      stretchFactor,
      setDotGroups,
      setCurrentGroupId,
      currentGroupId
    );
  };

  const handleRotateClick = () => {
    handleRotate(selectedGroup, rotationDegree, setDotGroups);
  };

  const handleAlign = (alignment) => {
    alignSelected(alignment, selectedGroup, setDotGroups, baseDotSpacing);
  };

  const handleStretchChange = (event) => {
    handleStretch(
      event.target.value,
      setStretchFactor,
      setDotGroups,
      selectedGroup,
      baseDotSpacing
    );
  };
  const generateDots = (
    selection,
    rowCount,
    colCount,
    baseDotSpacing,
    stretchFactor,
    setDotGroups,
    setCurrentGroupId,
    currentGroupId
  ) => {
    const generatedDots = [];
    const rowLabels = [];
    const stretchedSpacing = baseDotSpacing * stretchFactor;

    for (let i = 0; i < rowCount; i++) {
      for (let j = 0; j < colCount; j++) {
        const x = selection.x + j * stretchedSpacing;
        const y = selection.y + i * stretchedSpacing;
        generatedDots.push({
          cx: x,
          cy: y,
          originalY: y,
          row: i,
          col: j,
        });
      }

      rowLabels.push({
        label: `Row ${i + 1}`,
        x: selection.x - 40,
        y: selection.y + i * stretchedSpacing,
      });
    }

    const newWidth = (colCount - 1) * stretchedSpacing;
    const newHeight = (rowCount - 1) * stretchedSpacing;

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
        stretchFactor,
        columns: colCount,
        curveIntensity: 0,
        leftVenue: false, // Add the new property
        rightVenue: false, // New property
      },
    ]);

    setCurrentGroupId((prev) => prev + 1);
  };

  return (
    <div className="w-full max-w-4xl">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => {
            setMode("add");
            setSelectedGroup(null);
          }}
          className={`px-4 py-2 text-white ${mode === "add" ? "bg-green-500" : "bg-gray-400"
            }`}
        >
          Add
        </button>
        <button
          onClick={() => {
            setMode("select");
            setSelectedGroup(null);
          }}
          className={`px-4 py-2 text-white ${mode === "select" ? "bg-blue-500" : "bg-gray-400"
            }`}
        >
          Select
        </button>
        <button
          onClick={() => {
            setMode("delete");
            setSelectedGroup(null);
          }}
          className={`px-4 py-2 text-white ${mode === "delete" ? "bg-red-500" : "bg-gray-400"
            }`}
        >
          Delete
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => handleAlign("left")}
          className={`px-4 py-2 text-white ${selectedGroup !== null ? "bg-blue-500" : "bg-gray-400"
            }`}
          disabled={selectedGroup === null}
        >
          Left Align
        </button>
        <button
          onClick={() => handleAlign("center")}
          className={`px-4 py-2 text-white ${selectedGroup !== null ? "bg-blue-500" : "bg-gray-400"
            }`}
          disabled={selectedGroup === null}
        >
          Center Align
        </button>
        <button
          onClick={() => handleAlign("right")}
          className={`px-4 py-2 text-white ${selectedGroup !== null ? "bg-blue-500" : "bg-gray-400"
            }`}
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
          onClick={handleRotateClick}
          className={`px-4 py-2 text-white ${selectedGroup !== null ? "bg-purple-500" : "bg-gray-400"
            }`}
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
          onChange={handleStretchChange}
          className="w-48"
          disabled={selectedGroup === null}
        />
        <span className="text-sm">{stretchFactor.toFixed(1)}x</span>
      </div>

      <div className="flex gap-2 mb-4 items-center">
        <span className="text-sm font-medium">Curve:</span>
        <input
          type="range"
          min="-2"
          max="2"
          step="0.1"
          value={curveIntensity}
          onChange={(e) => handleCurveChange(e.target.value)}
          className="w-48"
          disabled={selectedGroup === null}
        />
        <span className="text-sm">{curveIntensity.toFixed(1)}</span>
      </div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => {
            if (selectedGroup !== null) {
              setDotGroups((prevGroups) =>
                prevGroups.map((group) =>
                  group.id === selectedGroup
                    ? { ...group, leftVenue: !group.leftVenue }
                    : group
                )
              );
            }
          }}
          className={`px-4 py-2 text-white ${selectedGroup !== null ? "bg-orange-500" : "bg-gray-400"
            }`}
          disabled={selectedGroup === null}
        >
          Toggle Left Venue
        </button>
      </div>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => {
            if (selectedGroup !== null) {
              setDotGroups((prevGroups) =>
                prevGroups.map((group) =>
                  group.id === selectedGroup
                    ? { ...group, rightVenue: !group.rightVenue }
                    : group
                )
              );
            }
          }}
          className={`px-4 py-2 text-white ${selectedGroup !== null ? "bg-orange-600" : "bg-gray-400"
            }`}
          disabled={selectedGroup === null}
        >
          Toggle Right Venue
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => {
            if (selectedGroup !== null) {
              setDotGroups((prevGroups) =>
                prevGroups.map((group) => {
                  if (group.id === selectedGroup) {
                    const spacing = group.centerVenue ? -20 : 20;
                    const curve = group.centerVenue ? 0 : 2.0
                    // Calculate center column indices
                    const colMid = Math.floor(group.columns / 2);
                    const updatedDots = group.dots.map((dot) => {
                      if (dot.col >= colMid) {
                        handleCurveChange(curve)
                        return { ...dot, cx: dot.cx + spacing }; // Add 20px gap to the right half
                      }
                      return dot; // Keep other dots unchanged
                    });

                    return {
                      ...group,
                      dots: updatedDots,
                      centerVenue: !group.centerVenue, // Toggle the centerVenue property
                    };
                  }
                  return group;
                })
              );
            }
          }}
          className={`px-4 py-2 text-white ${selectedGroup !== null ? "bg-orange-700" : "bg-gray-400"
            }`}
          disabled={selectedGroup === null}
        >
          Toggle Center Venue
        </button>
      </div>;

      <svg ref={svgRef}></svg>
    </div>
  );
};

export default InteractiveD3ChartWithNumbers;
