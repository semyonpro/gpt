const MATERIALS_STORAGE_KEY = "stair-materials";

const defaultMaterials = {
  woodPrices: {
    oak: 90000,
    beech: 70000,
    birch: 55000,
  },
  rodPrice: 800,
  anchorPrice: 650,
  landingPrice: 12000,
  winderCoef: 1.2,
  oilPrice: 1500,
  railPrice: 7500,
  woodType: "oak",
};

const elements = {
  tabs: document.querySelectorAll(".tab-button"),
  panels: document.querySelectorAll(".tab-panel"),
  landingToggle: document.getElementById("landing-toggle"),
  landingFields: document.getElementById("landing-fields"),
  calcForm: document.getElementById("calc-form"),
  resetCalc: document.getElementById("reset-calc"),
  calcError: document.getElementById("calc-error"),
  result: {
    totalPrice: document.getElementById("total-price"),
    totalSteps: document.getElementById("total-steps"),
    railMeters: document.getElementById("rail-meters"),
    costSteps: document.getElementById("cost-steps"),
    costMetal: document.getElementById("cost-metal"),
    costAnchor: document.getElementById("cost-anchor"),
    costOil: document.getElementById("cost-oil"),
    costRail: document.getElementById("cost-rail"),
    costLanding: document.getElementById("cost-landing"),
    costParts: document.getElementById("cost-parts"),
  },
  materialsForm: document.getElementById("materials-form"),
  materialsNote: document.getElementById("materials-note"),
  materialsInputs: {
    woodOak: document.getElementById("wood-oak"),
    woodBeech: document.getElementById("wood-beech"),
    woodBirch: document.getElementById("wood-birch"),
    rodPrice: document.getElementById("rod-price"),
    anchorPrice: document.getElementById("anchor-price"),
    landingPrice: document.getElementById("landing-price"),
    winderCoef: document.getElementById("winder-coef"),
    oilPrice: document.getElementById("oil-price"),
    railPrice: document.getElementById("rail-price"),
    woodType: document.getElementById("wood-type"),
  },
  calcInputs: {
    stepsStraight: document.getElementById("steps-straight"),
    stepsWinder: document.getElementById("steps-winder"),
    rise: document.getElementById("rise"),
    tread: document.getElementById("tread"),
    stepWidth: document.getElementById("step-width"),
    stepLength: document.getElementById("step-length"),
    balustrade: document.getElementById("balustrade"),
    landingWidth: document.getElementById("landing-width"),
    landingLength: document.getElementById("landing-length"),
  },
};

const formatCurrency = (value) => `${Math.round(value).toLocaleString("ru-RU")} ₽`;
const formatMeters = (value) => `${value.toFixed(2)} м`;

const showTab = (name) => {
  elements.tabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.tab === name);
  });
  elements.panels.forEach((panel) => {
    panel.classList.toggle("is-active", panel.id === `tab-${name}`);
  });
};

const normalizeNumberInput = (value) => value.trim().replace(/\s+/g, "").replace(",", ".");

const readNumber = (input) => {
  const normalized = normalizeNumberInput(input.value);
  if (!normalized) {
    return null;
  }
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
};

const readInt = (input) => {
  const normalized = normalizeNumberInput(input.value);
  if (!normalized) {
    return null;
  }
  const value = Number.parseFloat(normalized);
  return Number.isInteger(value) ? value : null;
};

const loadMaterials = () => {
  const saved = localStorage.getItem(MATERIALS_STORAGE_KEY);
  if (!saved) {
    return { ...defaultMaterials };
  }

  try {
    const parsed = JSON.parse(saved);
    return {
      ...defaultMaterials,
      ...parsed,
      woodPrices: {
        ...defaultMaterials.woodPrices,
        ...(parsed.woodPrices || {}),
      },
    };
  } catch {
    return { ...defaultMaterials };
  }
};

const saveMaterials = (materials) => {
  localStorage.setItem(MATERIALS_STORAGE_KEY, JSON.stringify(materials));
};

const applyMaterialsToForm = (materials) => {
  elements.materialsInputs.woodOak.value = materials.woodPrices.oak;
  elements.materialsInputs.woodBeech.value = materials.woodPrices.beech;
  elements.materialsInputs.woodBirch.value = materials.woodPrices.birch;
  elements.materialsInputs.rodPrice.value = materials.rodPrice;
  elements.materialsInputs.anchorPrice.value = materials.anchorPrice;
  elements.materialsInputs.landingPrice.value = materials.landingPrice;
  elements.materialsInputs.winderCoef.value = materials.winderCoef;
  elements.materialsInputs.oilPrice.value = materials.oilPrice;
  elements.materialsInputs.railPrice.value = materials.railPrice;
  elements.materialsInputs.woodType.value = materials.woodType;
};

const readMaterialsFromForm = () => {
  const woodOak = readNumber(elements.materialsInputs.woodOak);
  const woodBeech = readNumber(elements.materialsInputs.woodBeech);
  const woodBirch = readNumber(elements.materialsInputs.woodBirch);
  const rodPrice = readNumber(elements.materialsInputs.rodPrice);
  const anchorPrice = readNumber(elements.materialsInputs.anchorPrice);
  const landingPrice = readNumber(elements.materialsInputs.landingPrice);
  const winderCoef = readNumber(elements.materialsInputs.winderCoef);
  const oilPrice = readNumber(elements.materialsInputs.oilPrice);
  const railPrice = readNumber(elements.materialsInputs.railPrice);
  const woodType = elements.materialsInputs.woodType.value;

  const invalid = [
    woodOak,
    woodBeech,
    woodBirch,
    rodPrice,
    anchorPrice,
    landingPrice,
    winderCoef,
    oilPrice,
    railPrice,
  ].some((value) => value === null || value < 0);

  if (invalid || winderCoef === null || winderCoef <= 0) {
    return null;
  }

  return {
    woodPrices: {
      oak: woodOak,
      beech: woodBeech,
      birch: woodBirch,
    },
    rodPrice,
    anchorPrice,
    landingPrice,
    winderCoef,
    oilPrice,
    railPrice,
    woodType,
  };
};

const getSelectedWoodPrice = (materials) => materials.woodPrices[materials.woodType];

const calculate = (materials) => {
  const Np = readInt(elements.calcInputs.stepsStraight) ?? 0;
  const Nz = readInt(elements.calcInputs.stepsWinder) ?? 0;
  const riseMm = readNumber(elements.calcInputs.rise);
  const treadMm = readNumber(elements.calcInputs.tread);
  const widthMm = readNumber(elements.calcInputs.stepWidth);
  const lengthMm = readNumber(elements.calcInputs.stepLength);
  const balustrade = readNumber(elements.calcInputs.balustrade) ?? 0;
  const isLanding = elements.landingToggle.checked;
  const landingWidth = readNumber(elements.calcInputs.landingWidth);
  const landingLength = readNumber(elements.calcInputs.landingLength);

  if (Np === null || Nz === null || Np < 0 || Nz < 0) {
    return { error: "Количество ступеней должно быть целым числом ≥ 0" };
  }

  if (Np + Nz === 0) {
    return { error: "Укажите количество ступеней" };
  }

  const requiredValues = [riseMm, treadMm, widthMm, lengthMm];
  if (requiredValues.some((value) => value === null || value <= 0)) {
    return { error: "Заполните все обязательные размеры ступеней" };
  }

  if (balustrade !== null && balustrade < 0) {
    return { error: "Длина балюстрады не может быть отрицательной" };
  }

  if (isLanding) {
    if (!landingWidth || !landingLength || landingWidth <= 0 || landingLength <= 0) {
      return { error: "Укажите размеры площадки" };
    }
  }

  const H = riseMm / 1000;
  const T = treadMm / 1000;
  const W = widthMm / 1000;
  const L = lengthMm / 1000;
  void W;

  const woodPrice = getSelectedWoodPrice(materials);

  const V_step = (T + 0.06) * 0.06 * L;
  const C_step_straight = woodPrice * V_step * 1.5;
  const C_step_winder = C_step_straight * materials.winderCoef;
  const C_steps = Np * C_step_straight + Nz * C_step_winder;

  const C_metal = (Np * 0.44 + Nz * 0.66) * materials.rodPrice;
  const C_anchor = (Np * 0.4 + Nz * 0.6) * materials.anchorPrice;

  const A_step = T * L;
  const A_total = (Np + Nz) * A_step;
  const oilLiters = A_total / 15;
  const C_oil = oilLiters * materials.oilPrice;

  const hyp = Math.sqrt(T ** 2 + H ** 2);
  const railMeters = Np * hyp + (balustrade ?? 0);
  const C_rail = railMeters * materials.railPrice;

  const A_landing = isLanding ? landingWidth * landingLength : 0;
  const C_landing = isLanding ? A_landing * materials.landingPrice : 0;

  const C_parts = C_steps + C_metal + C_anchor + C_oil + C_rail + C_landing;
  const C_total = C_parts * 4;

  return {
    totalSteps: Np + Nz,
    railMeters,
    C_steps,
    C_metal,
    C_anchor,
    C_oil,
    C_rail,
    C_landing,
    C_parts,
    C_total,
  };
};

const updateResults = (result) => {
  elements.result.totalPrice.textContent = formatCurrency(result.C_total);
  elements.result.totalSteps.textContent = `${result.totalSteps} шт`;
  elements.result.railMeters.textContent = formatMeters(result.railMeters);
  elements.result.costSteps.textContent = formatCurrency(result.C_steps);
  elements.result.costMetal.textContent = formatCurrency(result.C_metal);
  elements.result.costAnchor.textContent = formatCurrency(result.C_anchor);
  elements.result.costOil.textContent = formatCurrency(result.C_oil);
  elements.result.costRail.textContent = formatCurrency(result.C_rail);
  elements.result.costLanding.textContent = formatCurrency(result.C_landing);
  elements.result.costParts.textContent = formatCurrency(result.C_parts);
};

const clearResults = () => {
  Object.values(elements.result).forEach((node) => {
    node.textContent = "—";
  });
};

const init = () => {
  const materials = loadMaterials();
  applyMaterialsToForm(materials);

  elements.tabs.forEach((tab) => {
    tab.addEventListener("click", () => showTab(tab.dataset.tab));
  });

  elements.landingToggle.addEventListener("change", () => {
    elements.landingFields.classList.toggle("is-hidden", !elements.landingToggle.checked);
  });

  elements.calcForm.addEventListener("submit", (event) => {
    event.preventDefault();
    elements.calcError.textContent = "";

    const storedMaterials = loadMaterials();
    const result = calculate(storedMaterials);

    if (result.error) {
      elements.calcError.textContent = result.error;
      clearResults();
      return;
    }

    updateResults(result);
  });

  elements.resetCalc.addEventListener("click", () => {
    elements.calcForm.reset();
    elements.landingFields.classList.add("is-hidden");
    elements.calcError.textContent = "";
    clearResults();
  });

  elements.materialsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const newMaterials = readMaterialsFromForm();

    if (!newMaterials) {
      elements.materialsNote.textContent = "Проверьте введенные значения: все цены ≥ 0, коэффициент > 0.";
      return;
    }

    saveMaterials(newMaterials);
    elements.materialsNote.textContent = "Материалы сохранены в локальном хранилище.";
  });

  document.getElementById("reset-materials").addEventListener("click", () => {
    applyMaterialsToForm(defaultMaterials);
    saveMaterials(defaultMaterials);
    elements.materialsNote.textContent = "Значения материалов сброшены к значениям по умолчанию.";
  });
};

init();
