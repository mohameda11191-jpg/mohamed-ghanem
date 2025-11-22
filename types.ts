

export enum DesignStyle {
  MODERN_MINIMALIST = 'Modern Minimalist',
  FUTURISTIC_TECH = 'Futuristic Tech',
  ECO_NATURAL = 'Eco-Friendly & Natural',
  INDUSTRIAL_CHIC = 'Industrial Chic',
  LUXURY_PREMIUM = 'Luxury Premium',
  PLAYFUL_VIBRANT = 'Playful & Vibrant',
}

export enum BoothPurpose {
  PRODUCT_DISPLAY = 'Product Display',
  VISITOR_RECEPTION = 'Visitor Reception',
  MEETINGS = 'Meetings',
  NEW_PRODUCT_LAUNCH = 'New Product Launch',
  DIGITAL_SCREENS_LED = 'Digital Screens / LED Content',
  BRAND_AWARENESS = 'Brand Awareness',
  LEAD_GENERATION = 'Lead Generation',
}

export enum BoothElement {
  RECEPTION_COUNTER = 'Reception Counter',
  PRODUCT_DISPLAY_AREA = 'Product Display Area',
  LED_SCREENS = 'LED Screens',
  MEETING_TABLE = 'Meeting Table',
  SEATING_AREA = 'Seating Area',
  STANDS_DISPLAY_VITRINES = 'Stands / Display Vitrines',
  HANGING_BANNER_CEILING = 'Hanging Banner / Ceiling Structure',
  RAISED_FLOORING = 'Raised Flooring',
  SPECIAL_LIGHTING = 'Special Lighting',
  STORAGE_ROOM = 'Storage Room',
  INTERACTIVE_KIOSK = 'Interactive Kiosk',
  REFRESHMENT_BAR = 'Refreshment Bar',
  LOUNGE_SEATING = 'Lounge Seating',
}

export enum GraphicRequirement {
  CUSTOM_POSTERS_IMAGES = 'Custom Posters or Images',
  MARKETING_TEXT_SLIDERS = 'Marketing Text or Sliders',
  BRANDING_ELEMENTS = 'General Branding Elements',
}

export enum LightingPreference {
  WHITE = 'White Lighting',
  WARM = 'Warm Lighting',
  COOL = 'Cool Lighting',
  BACKLIT_PANELS = 'Backlit Panels',
  SPOTLIGHTS = 'Spotlights',
  LED_STRIPS = 'LED Strips',
}

export enum MaterialPreference {
  WOOD = 'Wood',
  ACRYLIC = 'Acrylic',
  STAINLESS_STEEL = 'Stainless Steel',
  GLASS = 'Glass',
  MDF = 'MDF (Medium-density fibreboard)',
  FABRIC = 'Fabric',
  CONCRETE = 'Concrete',
  METAL_MESH = 'Metal Mesh',
}

export enum UnitPreference {
  FEET = 'ft',
  METERS = 'm',
}

export enum PageName {
  WELCOME = 'welcome',
  CONFIG = 'config',
  HISTORY = 'history',
}

export enum ConfigPhase {
  GENERAL_INFO = 'General Info',
  DIMENSIONS = 'Dimensions & Storage',
  PURPOSE_ELEMENTS = 'Purpose & Elements',
  VISUAL_GRAPHICS = 'Visuals & Graphics',
  LIGHTING_MATERIALS = 'Lighting & Materials',
  FINAL_DETAILS = 'Budget & Notes',
}

export interface BoothRequirements {
  // General Info
  industry: string;

  // Dimensions
  length: number;
  width: number;
  height: number;
  unit: UnitPreference; // Added unit preference
  storageRoomRequired: boolean;
  storageAreaNotes: string; // Specific storage area needs

  // Purpose
  purpose: BoothPurpose[];
  otherPurpose: string;

  // Elements
  elements: BoothElement[];
  otherElements: string;

  // Visual Identity
  style: DesignStyle;
  primaryBrandColors: string; // Renamed from brandColors
  secondaryBrandColors: string;
  brandGuidelineAvailable: boolean;
  logoFileName: string | null; // Added for logo file name display and prompt

  // Graphics
  graphics: GraphicRequirement[];
  otherGraphics: string;

  // Lighting
  lightingStyle: LightingPreference[];
  otherLighting: string;

  // Materials
  preferredMaterials: MaterialPreference[];
  otherMaterials: string;

  // Budget & References
  estimatedBudget: string;
  references: string; // URLs or descriptions

  // Final Notes
  additionalNotes: string;
}

export interface GeneratedDesign {
  id: string;
  imageUrl: string;
  promptUsed: string;
  rationale: string;
  timestamp: number;
}