import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";

const InteractiveD3ChartWithNumbers = () => {
  const svgRef = useRef();
  const [dotGroups, setDotGroups] = useState([]);
  const [mode, setMode] = useState("add");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [currentGroupId, setCurrentGroupId] = useState(0);
  const [curveDegree, setCurveDegree] = useState(0);

  const baseDotSpacing = 30;

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    svg
      .attr("width", 800)
      .attr("height", 400)
      .style("background", "#e9f5ff")
      .style("cursor", mode === "select" ? "pointer" : "crosshair");
  
    svg.selectAll("*").remove();
  
    let selection = null;
  
    const dragBehavior = d3.drag()
      .on("start", (event) => {
        if (mode === "select") return;
        const [x, y] = d3.pointer(event);
        selection = { x, y, width: 0, height: 0 };
        svg.append("rect").attr("class", "selection");
      })
      .on("drag", (event) => {
        if (mode === "select" || !selection) return;
        const [x, y] = d3.pointer(event);
        selection.width = Math.abs(x - selection.x);
        selection.height = Math.abs(y - selection.y);
        selection.x = x < selection.x ? x : selection.x;
        selection.y = y < selection.y ? y : selection.y;
  
        svg.select(".selection")
          .attr("x", selection.x)
          .attr("y", selection.y)
          .attr("width", selection.width)
          .attr("height", selection.height)
          .style("fill", "rgba(100, 150, 255, 0.3)");
      })
      .on("end", () => {
        if (mode === "select" || !selection) return;
        const rowCount = Math.floor(selection.height / baseDotSpacing);
        const colCount = Math.floor(selection.width / baseDotSpacing);
        generateDots(selection, rowCount, colCount);
        svg.select(".selection").remove();
        selection = null;
      });
  
    svg.call(dragBehavior);
  
    svg.on("click", (event) => {
      if (mode !== "select") return;
      const [x, y] = d3.pointer(event);
      const clickedGroup = dotGroups.find(group => {
        return x >= group.bounds.x && x <= group.bounds.x + group.bounds.width &&
          y >= group.bounds.y && y <= group.bounds.y + group.bounds.height;
      });
      setSelectedGroup(clickedGroup ? clickedGroup.id : null);
    });
  
    dotGroups.forEach((group) => {
      const isSelected = group.id === selectedGroup;
      const curve = isSelected ? curveDegree : group.curve || 0;
  
      // Draw row numbers and adjust positions for stretch
      const rowLabels = new Set(group.dots.map(dot => dot.row));
      rowLabels.forEach(row => {
        const dotsInRow = group.dots.filter(dot => dot.row === row);
        if (dotsInRow.length > 0) {
          // Calculate the average curved and stretched position for the row
          const avgX = d3.mean(dotsInRow, (dot) => {
            const centerX = group.bounds.x + group.bounds.width / 2;
            const distanceFromCenter = (dot.originalX - centerX) / (group.bounds.width / 2);
            const rowProgress = dot.row / (group.bounds.height / baseDotSpacing);
  
            let x = dot.originalX;
            if (curve > 0) {
              const horizontalCurve = distanceFromCenter * curve * 0.2 * rowProgress;
              x -= horizontalCurve;
            }
            return x;
          });
  
          const avgY = d3.mean(dotsInRow, (dot) => {
            const centerX = group.bounds.x + group.bounds.width / 2;
            const distanceFromCenter = (dot.originalX - centerX) / (group.bounds.width / 2);
            const rowProgress = dot.row / (group.bounds.height / baseDotSpacing);
  
            let y = dot.originalY;
            if (curve > 0) {
              const curveAmount = (Math.pow(Math.abs(distanceFromCenter), 1.5) * curve) * rowProgress;
              y += curveAmount;
            }
            return y;
          });
  
          svg.append("text")
            .attr("x", avgX - 30) // Adjust label position based on stretched X
            .attr("y", avgY + 4) // Align with the calculated curved and stretched position
            .text(`Row ${row + 1}`) // Row numbers start from 1
            .attr("fill", "black")
            .attr("text-anchor", "end")
            .attr("font-size", "10px");
        }
      });
  
      group.dots.forEach((dot) => {
        const centerX = group.bounds.x + group.bounds.width / 2;
        const distanceFromCenter = (dot.originalX - centerX) / (group.bounds.width / 2);
        const rowProgress = dot.row / (group.bounds.height / baseDotSpacing);
  
        let x = dot.originalX;
        let y = dot.originalY;
  
        if (curve > 0) {
          const curveAmount = (Math.pow(Math.abs(distanceFromCenter), 1.5) * curve) * rowProgress;
          y += curveAmount;
  
          const horizontalCurve = distanceFromCenter * curve * 0.2 * rowProgress;
          x -= horizontalCurve;
        }
  
        const g = svg.append("g");
        g.append("circle")
          .attr("cx", x)
          .attr("cy", y)
          .attr("r", 10)
          .attr("fill", isSelected ? "#2196f3" : "#4caf50");
  
        g.append("text")
          .attr("x", x)
          .attr("y", y + 4)
          .text(dot.number)
          .attr("fill", "white")
          .attr("text-anchor", "middle")
          .attr("font-size", "10px");
      });
  
      if (isSelected) {
        svg.append("rect")
          .attr("x", group.bounds.x - 2)
          .attr("y", group.bounds.y - 2)
          .attr("width", group.bounds.width + 4)
          .attr("height", group.bounds.height + 4)
          .attr("fill", "none")
          .attr("stroke", "#2196f3")
          .attr("stroke-width", 2);
      }
    });
  }, [dotGroups, mode, selectedGroup, curveDegree]);
  


  const generateDots = (selection, rowCount, colCount) => {
    const dots = [];
    let number = 1;

    for (let row = 0; row < rowCount; row++) {
      for (let col = 0; col < colCount; col++) {
        const x = selection.x + col * baseDotSpacing;
        const y = selection.y + row * baseDotSpacing;
        dots.push({
          originalX: x,
          originalY: y,
          row,
          col,
          number
        });
        number++;
      }
    }

    setDotGroups(prev => [...prev, {
      id: currentGroupId,
      dots,
      bounds: selection,
      curve: 0
    }]);
    setCurrentGroupId(prev => prev + 1);
  };

  const handleCurve = () => {
    setDotGroups(prev =>
      prev.map(group =>
        group.id === selectedGroup
          ? { ...group, curve: curveDegree }
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
      </div>

      <div className="flex gap-2 mb-4 items-center">
        <span className="text-sm font-medium">Curve:</span>
        <input
          type="range"
          min="0"
          max="100"
          value={curveDegree}
          onChange={(e) => {
            setCurveDegree(parseInt(e.target.value));
            handleCurve();
          }}
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