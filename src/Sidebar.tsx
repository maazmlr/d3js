import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Toggle } from "@/components/ui/toggle";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronUp,
  ChevronDown,
  X,
} from "lucide-react";
import clsx from "clsx";

const SectorToolbar = ({
  rotationDegree,
  stretchFactor,
  handleStretchChange,
  curveIntensity,
  handleCurveChange,
  onClose,
  handleAlign,
  handleRotateClick,
  clickCenterVenue,
  venue,
  setMode
}) => {
  console.log("veu");

  return (
    <Card className="w-72 bg-white shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">SECTOR</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sector Title */}
        <div className="space-y-2">
          <Label htmlFor="sector-title">Sector Title</Label>
          <Input id="sector-title" placeholder="Untitled Sector" />
        </div>

        {/* Row Labels */}
        {/* <div className="space-y-2">
          <Label>Row Labels</Label>
          <div className="flex gap-2">
            <Toggle aria-label="Toggle numbers">123</Toggle>
            <Toggle aria-label="Toggle letters">ABC</Toggle>
            <Toggle aria-label="Toggle custom">Custom</Toggle>
          </div>
        </div> */}

        <Separator />

        {/* Align Rows */}
        <div className="space-y-2">
          <Label>ALIGN ROWS</Label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleAlign("left")}
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleAlign("center")}
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleAlign("right")}
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Add Rows
        <div className="space-y-2">
          <Label>ADD ROWS</Label>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Top</span>
              <Button variant="outline" size="icon">
                <ChevronUp className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Bottom</span>
              <Button variant="outline" size="icon">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div> */}

        <Separator />

        {/* Transform */}
        <div className="space-y-4">
          <Label>TRANSFORM</Label>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Rotate</span>
              <span className="text-sm text-muted-foreground">
                {rotationDegree}°
              </span>
            </div>
            <Slider
              value={[rotationDegree]}
              onValueChange={([value]) => handleRotateClick(value)}
              max={360}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Curve</span>
              <span className="text-sm text-muted-foreground">
                {curveIntensity}
              </span>
            </div>
            <Slider
              value={[curveIntensity]}
              onValueChange={([value]) => handleCurveChange(value)}
              min={-2}
              max={2}
              step={0.1}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Stretch</span>
              <span className="text-sm text-muted-foreground">
                {stretchFactor}x
              </span>
            </div>
            <Slider
              value={[stretchFactor]}
              onValueChange={([value]) =>
                handleStretchChange({ target: { value } })
              }
              min={0.5}
              max={2}
              step={0.1}
            />
          </div>
        </div>

        <Separator />

        {/* Venue Shape */}
        <div className="space-y-2">
          <Label>Venue Shape</Label>
          <div className="flex gap-2">
            <Toggle className={`${!venue && "bg-black text-white"}`}>Off</Toggle>
            <Toggle className={`${venue === "center" && "bg-black text-white"}`} onClick={() => clickCenterVenue("center")}>Center</Toggle>
            <Toggle className={`${venue === "left" && "bg-black text-white"}`} onClick={() => clickCenterVenue("left")}>Left</Toggle>
            <Toggle className={clsx(venue === "right" && "bg-black text-white")} onClick={() => clickCenterVenue("right")}>Right</Toggle>
          </div>
          <span className="text-xs text-muted-foreground">
            Configures Venue Shape
          </span>
        </div>

        {/* Actions */}
        <div className="pt-2 flex justify-between ">
          <Button onClick={() => setMode("add")} variant="destructive" className="w-28">
            Add
          </Button>
          <Button onClick={() => setMode("delete")} variant="default" className="w-28">
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SectorToolbar;
