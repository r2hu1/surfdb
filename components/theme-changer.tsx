"use client";

import { Moon, Sun, Laptop } from "reicon-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import { ButtonGroup } from "./ui/button-group";

export function ModeToggle() {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <ButtonGroup className="capitalize mx-auto">
      <Button variant="secondary" onClick={() => setTheme("dark")}>
        Dark <Moon />
      </Button>
      <Button variant="secondary" onClick={() => setTheme("light")}>
        Light <Sun />
      </Button>
      <Button variant="secondary" onClick={() => setTheme("system")}>
        System <Laptop />
      </Button>
    </ButtonGroup>
  );
}
