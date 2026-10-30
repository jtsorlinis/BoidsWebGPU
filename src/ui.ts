const minExponent = 5;
const minBoids = 1 << minExponent;
const fpsInterval = 0.25;

export const initialBoids = minBoids;

const getElement = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;

const format = (count: number) => count.toLocaleString("en-US");

export const createUI = () => {
  const fpsBadge = getElement("fps-badge");
  const fpsLabel = getElement("fps");
  const countLabel = getElement("boid-count");
  const minLabel = getElement("boid-min");
  const maxLabel = getElement("boid-max");
  const view2D = getElement<HTMLButtonElement>("view-2d");
  const view3D = getElement<HTMLButtonElement>("view-3d");
  const slider = getElement<HTMLInputElement>("boid-slider");
  const avoidRow = getElement("avoid-row");
  const avoidToggle = getElement<HTMLInputElement>("avoid-toggle");
  const hint = getElement("hint");

  let numBoids = initialBoids;
  let maxBoids = minBoids;
  let is3D = false;
  let frames = 0;
  let fpsTimer = 0;

  const handlers = {
    numBoidsChanged: (_count: number) => {},
    viewChanged: (_is3D: boolean) => {},
    avoidMouseChanged: (_avoid: boolean) => {},
  };

  // Slider position is log2 of the boid count, so each octave gets the same travel.
  // Snaps the far end to the exact limit, pow loses precision up there.
  const countFor = (exponent: number) =>
    exponent >= Math.log2(maxBoids) - 0.0001
      ? maxBoids
      : Math.round(Math.pow(2, exponent));

  const refresh = () => {
    const maxExponent = Math.log2(maxBoids);
    slider.max = maxExponent.toString();
    // Leave the handle alone while it already shows this count (e.g. mid drag)
    if (countFor(slider.valueAsNumber) !== numBoids) {
      slider.valueAsNumber = Math.min(Math.log2(numBoids), maxExponent);
    }
    const fill = (slider.valueAsNumber - minExponent) / (maxExponent - minExponent);
    slider.style.setProperty("--fill", `${Math.max(0, fill) * 100}%`);

    countLabel.textContent = format(numBoids);
    maxLabel.textContent = format(maxBoids);
    view2D.classList.toggle("segment--selected", !is3D);
    view3D.classList.toggle("segment--selected", is3D);
    avoidRow.hidden = is3D;
    hint.textContent = is3D
      ? "Drag to look around\nWASD + Q/E while dragging to fly\nHold Shift to fly faster"
      : "Drag to pan · Scroll to zoom";
  };

  view2D.onclick = () => {
    if (is3D) handlers.viewChanged(false);
  };
  view3D.onclick = () => {
    if (!is3D) handlers.viewChanged(true);
  };

  slider.oninput = () => {
    // The slider moves smoothly but only whole boid counts restart the sim
    const count = countFor(slider.valueAsNumber);
    if (count !== numBoids) {
      numBoids = count;
      handlers.numBoidsChanged(count);
    }
    refresh();
  };
  // Keep arrow keys for flying rather than the slider
  slider.onpointerup = () => slider.blur();

  avoidToggle.onchange = () => {
    avoidToggle.blur();
    handlers.avoidMouseChanged(avoidToggle.checked);
  };

  minLabel.textContent = format(minBoids);
  refresh();

  return {
    on: handlers,

    setView: (view3D: boolean) => {
      is3D = view3D;
      numBoids = initialBoids;
      avoidToggle.checked = false;
      refresh();
    },

    setLimit: (limit: number) => {
      maxBoids = limit;
      refresh();
    },

    frame: (deltaTime: number) => {
      frames++;
      fpsTimer += deltaTime;
      if (fpsTimer < fpsInterval) {
        return;
      }

      const fps = Math.round(frames / fpsTimer);
      fpsLabel.textContent = fps.toString();
      fpsBadge.classList.toggle("fps--good", fps >= 55);
      fpsBadge.classList.toggle("fps--ok", fps >= 30 && fps < 55);
      fpsBadge.classList.toggle("fps--bad", fps < 30);
      frames = 0;
      fpsTimer = 0;
    },
  };
};
