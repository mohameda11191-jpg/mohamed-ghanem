

import React, { useState, useCallback, useEffect } from 'react';
import { 
  BoothRequirements, 
  DesignStyle, 
  BoothPurpose, 
  BoothElement, 
  GraphicRequirement, 
  LightingPreference, 
  MaterialPreference,
  UnitPreference,
  ConfigPhase
} from '../types';
import { 
  Briefcase, 
  Palette, 
  Layers, 
  Zap, 
  Move3D, 
  Target, 
  Blocks, 
  Type, 
  Lightbulb, 
  TreePine, 
  Scale,
  UploadCloud,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Info
} from 'lucide-react';
import AutocompleteInputField from './AutocompleteInputField'; // Corrected import path

interface ConfigurationFormProps {
  onFullGenerate: (data: BoothRequirements, logoFile: File | null) => void;
  isAnyGenerating: boolean; // Combines full image and preview generation states
}

// Extracted InputField component to prevent re-declaration on every ConfigurationForm render
const InputField: React.FC<{ 
  label: string; 
  value: string | number; 
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; 
  placeholder?: string; 
  type?: string; 
  icon?: React.ElementType;
  required?: boolean;
  min?: number;
  rows?: number; // Added for textarea support
  colorSwatch?: boolean; // New prop for color input
}> = React.memo(({ label, value, onChange, placeholder, type = 'text', icon: Icon, required = false, min, rows, colorSwatch = false }) => (
  <div>
    <label className="block text-sm font-medium text-slate-300 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />}
      {rows ? (
        <textarea
          rows={rows}
          required={required}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 resize-none transition-all duration-200 ease-in-out ${Icon ? 'pl-10' : ''}`}
        />
      ) : (
        <input
          id={`input-field-${label.replace(/\s/g, '-')}`} // Unique ID for color picker interaction
          type={type}
          required={required}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-all duration-200 ease-in-out ${Icon ? 'pl-10' : ''} ${colorSwatch ? 'pr-12' : ''}`}
          min={min}
        />
      )}
      {colorSwatch && typeof value === 'string' && (
        <div 
          className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border border-slate-600 cursor-pointer" 
          style={{ backgroundColor: value || '#cccccc' }}
          onClick={() => { // Allow clicking swatch to open color picker
            const inputElement = document.getElementById(`input-field-${label.replace(/\s/g, '-')}`) as HTMLInputElement;
            if (inputElement && inputElement.type === 'color') {
              inputElement.click();
            }
          }}
          title="Click to open color picker"
        ></div>
      )}
    </div>
  </div>
));

// Extracted CheckboxGroup component to prevent re-declaration on every ConfigurationForm render
const CheckboxGroup: React.FC<{ 
  label: string; 
  options: string[]; 
  selected: string[]; 
  onToggle: (value: string) => void; 
  otherValue: string; 
  onOtherChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  icon?: React.ElementType;
  placeholder?: string;
  required?: boolean; // Added required prop
}> = React.memo(({ label, options, selected, onToggle, otherValue, onOtherChange, icon: Icon, placeholder, required = false }) => (
  <div>
    <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center">
      {Icon && <Icon className="w-4 h-4 mr-2 text-slate-500" />}
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="flex flex-wrap gap-2 mb-3">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onToggle(option)}
          className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ease-in-out hover:scale-105 ${
            selected.includes(option)
              ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50 ring-2 ring-offset-2 ring-blue-500 ring-offset-slate-900' // Added ring for emphasis
              : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
    <div className="relative">
      <input
        type="text" // Keep as text, but allow the user to type hex or common names
        value={otherValue}
        onChange={onOtherChange}
        placeholder={placeholder || `Other ${label.toLowerCase()}`}
        className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 transition-all duration-200 ease-in-out"
      />
    </div>
  </div>
));

const initialRequirements: BoothRequirements = {
  industry: '',
  length: 10,
  width: 10,
  height: 12,
  unit: UnitPreference.METERS, // Changed default unit to METERS
  storageRoomRequired: false,
  storageAreaNotes: '',
  purpose: [],
  otherPurpose: '',
  elements: [],
  otherElements: '',
  style: DesignStyle.MODERN_MINIMALIST,
  primaryBrandColors: '',
  secondaryBrandColors: '',
  brandGuidelineAvailable: false,
  logoFileName: null,
  graphics: [],
  otherGraphics: '',
  lightingStyle: [],
  otherLighting: '',
  preferredMaterials: [],
  otherMaterials: '',
  estimatedBudget: '',
  references: '',
  additionalNotes: '',
};

const industrySuggestions = [
  'Technology', 'Automotive', 'Healthcare', 'Finance', 'Education', 'Food & Beverage',
  'Fashion', 'Retail', 'Real Estate', 'Manufacturing', 'Energy', 'Gaming', 'Travel', 'Marketing', 'E-commerce'
];

const budgetSuggestions = [
  'Low', 'Medium', 'High', 'Luxury', '$5K-$10K', '$10K-$25K', '$25K-$50K', '$50K+'
];

const ConfigurationForm: React.FC<ConfigurationFormProps> = ({ onFullGenerate, isAnyGenerating }) => {
  const [currentPhase, setCurrentPhase] = useState<ConfigPhase>(ConfigPhase.GENERAL_INFO);
  const [requirements, setRequirements] = useState<BoothRequirements>(initialRequirements);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const updateRequirements = useCallback(<K extends keyof BoothRequirements>(key: K, value: BoothRequirements[K]) => {
    setRequirements(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleToggleSelection = useCallback(<T extends string>(
    field: keyof BoothRequirements, 
    value: T
  ) => {
    setRequirements(prev => {
      const currentArray = prev[field] as T[];
      const newArray = currentArray.includes(value) 
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      return { ...prev, [field]: newArray as BoothRequirements[typeof field] };
    });
  }, []);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
      updateRequirements('logoFileName', e.target.files[0].name);
    } else {
      setLogoFile(null);
      updateRequirements('logoFileName', null);
    }
  };

  const clearLogo = () => {
    setLogoFile(null);
    updateRequirements('logoFileName', null);
    const fileInput = document.getElementById('logo-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const phases = Object.values(ConfigPhase);
  const currentPhaseIndex = phases.indexOf(currentPhase);
  const isFirstPhase = currentPhaseIndex === 0;
  const isLastPhase = currentPhaseIndex === phases.length - 1;

  const validateCurrentPhase = () => {
    switch (currentPhase) {
      case ConfigPhase.GENERAL_INFO:
        return !!requirements.industry.trim();
      case ConfigPhase.DIMENSIONS:
        return requirements.length > 0 && requirements.width > 0 && requirements.height > 0;
      case ConfigPhase.PURPOSE_ELEMENTS:
        const hasPurpose = requirements.purpose.length > 0 || !!requirements.otherPurpose.trim();
        const hasElements = requirements.elements.length > 0 || !!requirements.otherElements.trim();
        return hasPurpose && hasElements;
      case ConfigPhase.VISUAL_GRAPHICS:
        // Primary brand colors is required for visual consistency, even if empty string is not ideal
        return !!requirements.primaryBrandColors.trim(); 
      case ConfigPhase.LIGHTING_MATERIALS:
        const hasLighting = requirements.lightingStyle.length > 0 || !!requirements.otherLighting.trim();
        const hasMaterials = requirements.preferredMaterials.length > 0 || !!requirements.otherMaterials.trim();
        return hasLighting && hasMaterials;
      case ConfigPhase.FINAL_DETAILS:
        // Fields in final details are now optional for phase validation
        return true;
      default:
        return false; // Should not reach here, but acts as a safeguard
    }
  };

  const validateAllRequiredPhases = useCallback(() => {
    // Check all truly required phases, not just the current one
    const generalInfoValid = !!requirements.industry.trim();
    const dimensionsValid = requirements.length > 0 && requirements.width > 0 && requirements.height > 0;
    const purposeElementsValid = 
      (requirements.purpose.length > 0 || !!requirements.otherPurpose.trim()) &&
      (requirements.elements.length > 0 || !!requirements.otherElements.trim());
    const visualGraphicsValid = !!requirements.primaryBrandColors.trim();
    const lightingMaterialsValid = 
      (requirements.lightingStyle.length > 0 || !!requirements.otherLighting.trim()) &&
      (requirements.preferredMaterials.length > 0 || !!requirements.otherMaterials.trim());
    
    // Final Details fields are NOT explicitly required for the overall generation trigger
    return generalInfoValid && dimensionsValid && purposeElementsValid && visualGraphicsValid && lightingMaterialsValid;
  }, [requirements]);


  const handleNext = () => {
    if (validateCurrentPhase()) {
      if (!isLastPhase) {
        setCurrentPhase(phases[currentPhaseIndex + 1]);
      }
    } else {
      alert('Please fill in all required fields to proceed.');
    }
  };

  const handlePrevious = () => {
    if (!isFirstPhase) {
      setCurrentPhase(phases[currentPhaseIndex - 1]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateAllRequiredPhases()) { // <--- Changed from validateCurrentPhase()
      onFullGenerate(requirements, logoFile); // Pass logoFile here
    } else {
      alert('Please fill in all required fields before generating the design.');
    }
  };

  // Prevent form submission on Enter key unless it's the specific submit button
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLElement;
      // Check if the target is an input/textarea and not a button that should trigger submit
      if (
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') &&
        !(target instanceof HTMLButtonElement && target.type === 'submit')
      ) {
        e.preventDefault();
      }
    }
  }, []);

  const renderPhaseContent = () => {
    switch (currentPhase) {
      case ConfigPhase.GENERAL_INFO:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white flex items-center mb-4">
              <Info className="w-5 h-5 mr-2 text-blue-400" />
              Client & General Information
            </h3>
            <AutocompleteInputField 
              label="Industry / Sector" 
              value={requirements.industry} 
              onChange={(e) => updateRequirements('industry', e.target.value)} 
              onSuggestionSelected={(value) => updateRequirements('industry', value)}
              suggestions={industrySuggestions}
              placeholder="e.g. Cybersecurity, Organic Food, Automotive" 
              icon={Briefcase}
              required
            />
          </div>
        );
      case ConfigPhase.DIMENSIONS:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white flex items-center mb-4">
              <Move3D className="w-5 h-5 mr-2 text-blue-400" />
              Booth Dimensions & Structure
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <InputField 
                label="Length" 
                value={requirements.length} 
                onChange={(e) => updateRequirements('length', Number(e.target.value))} 
                type="number" 
                min={1}
                required
              />
              <InputField 
                label="Width" 
                value={requirements.width} 
                onChange={(e) => updateRequirements('width', Number(e.target.value))} 
                type="number" 
                min={1}
                required
              />
              <InputField 
                label="Height (Max)" 
                value={requirements.height} 
                onChange={(e) => updateRequirements('height', Number(e.target.value))} 
                type="number" 
                min={1}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Units
              </label>
              <div className="relative">
                <select
                  value={requirements.unit}
                  onChange={(e) => updateRequirements('unit', e.target.value as UnitPreference)}
                  className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 appearance-none transition-all duration-200 ease-in-out"
                >
                  {Object.values(UnitPreference).map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="flex items-center text-sm font-medium text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requirements.storageRoomRequired}
                  onChange={(e) => updateRequirements('storageRoomRequired', e.target.checked)}
                  className="form-checkbox h-4 w-4 text-blue-600 bg-slate-900 border-slate-700 rounded focus:ring-blue-500 mr-2 transition-all duration-200 ease-in-out"
                />
                Storage Room Required?
              </label>
              {requirements.storageRoomRequired && (
                <div className="mt-3">
                  <InputField 
                    label="Required Storage Area Notes" 
                    value={requirements.storageAreaNotes} 
                    onChange={(e) => updateRequirements('storageAreaNotes', e.target.value)} 
                    placeholder="e.g. 5x5m with shelving, hidden access" 
                    rows={2}
                  />
                </div>
              )}
            </div>
          </div>
        );
      case ConfigPhase.PURPOSE_ELEMENTS:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white flex items-center mb-4">
              <Target className="w-5 h-5 mr-2 text-blue-400" />
              Booth Purpose & Elements
            </h3>
            <CheckboxGroup
              label="Purpose of the Booth"
              options={Object.values(BoothPurpose)}
              selected={requirements.purpose as string[]}
              onToggle={(val) => handleToggleSelection('purpose', val)}
              otherValue={requirements.otherPurpose}
              onOtherChange={(e) => updateRequirements('otherPurpose', e.target.value)}
              icon={Target}
              placeholder="Other purposes (e.g., product demonstration, press interviews)"
              required // Marked as required
            />
            <CheckboxGroup
              label="Required Booth Elements"
              options={Object.values(BoothElement)}
              selected={requirements.elements as string[]}
              onToggle={(val) => handleToggleSelection('elements', val)}
              otherValue={requirements.otherElements}
              onOtherChange={(e) => updateRequirements('otherElements', e.target.value)}
              icon={Blocks}
              placeholder="Other specific elements (e.g., interactive display, demo stage)"
              required // Marked as required
            />
          </div>
        );
      case ConfigPhase.VISUAL_GRAPHICS:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white flex items-center mb-4">
              <Palette className="w-5 h-5 mr-2 text-blue-400" />
              Visual Identity & Graphics
            </h3>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center">
                <Layers className="w-4 h-4 mr-2 text-slate-500" />
                Design Style
              </label>
              <div className="relative">
                <select
                  value={requirements.style}
                  onChange={(e) => updateRequirements('style', e.target.value as DesignStyle)}
                  className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5 appearance-none transition-all duration-200 ease-in-out"
                >
                  {Object.values(DesignStyle).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <InputField 
              label="Primary Brand Colors" 
              value={requirements.primaryBrandColors} 
              onChange={(e) => updateRequirements('primaryBrandColors', e.target.value)} 
              placeholder="e.g. Navy Blue and Gold, or #FF5733" 
              required
              type="color"
              colorSwatch
            />
            <InputField 
              label="Secondary Brand Colors" 
              value={requirements.secondaryBrandColors} 
              onChange={(e) => updateRequirements('secondaryBrandColors', e.target.value)} 
              placeholder="e.g. Silver, Light Grey" 
              type="color"
              colorSwatch
            />
            <div>
              <label className="flex items-center text-sm font-medium text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requirements.brandGuidelineAvailable}
                  onChange={(e) => updateRequirements('brandGuidelineAvailable', e.target.checked)}
                  className="form-checkbox h-4 w-4 text-blue-600 bg-slate-900 border-slate-700 rounded focus:ring-blue-500 mr-2 transition-all duration-200 ease-in-out"
                />
                Brand Guideline Available? (Indicates strict adherence needed)
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center">
                <UploadCloud className="w-4 h-4 mr-2 text-slate-500" />
                Upload Logo (Optional)
              </label>
              <div className="relative">
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <label htmlFor="logo-upload" className="flex items-center justify-between w-full bg-slate-900 border border-slate-700 text-slate-400 text-sm rounded-lg cursor-pointer p-2.5 hover:bg-slate-800 transition-colors duration-200 ease-in-out">
                  <span>{logoFile ? logoFile.name : 'Choose file...'}</span>
                  {logoFile && (
                    <button type="button" onClick={clearLogo} className="text-slate-500 hover:text-red-400 p-1 rounded-full">
                      <XCircle className="w-5 h-5" />
                    </button>
                  )}
                </label>
              </div>
            </div>
            <CheckboxGroup
              label="Required Graphics"
              options={Object.values(GraphicRequirement)}
              selected={requirements.graphics as string[]}
              onToggle={(val) => handleToggleSelection('graphics', val)}
              otherValue={requirements.otherGraphics}
              onOtherChange={(e) => updateRequirements('otherGraphics', e.target.value)}
              icon={Type}
              placeholder="Other graphic needs (e.g., product visuals, interactive displays)"
            />
          </div>
        );
      case ConfigPhase.LIGHTING_MATERIALS:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white flex items-center mb-4">
              <Lightbulb className="w-5 h-5 mr-2 text-blue-400" />
              Lighting & Materials
            </h3>
            <CheckboxGroup
              label="Lighting Style"
              options={Object.values(LightingPreference)}
              selected={requirements.lightingStyle as string[]}
              onToggle={(val) => handleToggleSelection('lightingStyle', val)}
              otherValue={requirements.otherLighting}
              onOtherChange={(e) => updateRequirements('otherLighting', e.target.value)}
              icon={Lightbulb}
              placeholder="Other lighting specifics (e.g., color-changing LEDs, projection mapping)"
              required // Marked as required
            />
            <CheckboxGroup
              label="Preferred Materials"
              options={Object.values(MaterialPreference)}
              selected={requirements.preferredMaterials as string[]}
              onToggle={(val) => handleToggleSelection('preferredMaterials', val)}
              otherValue={requirements.otherMaterials}
              onOtherChange={(e) => updateRequirements('otherMaterials', e.target.value)}
              icon={TreePine}
              placeholder="Other materials (e.g., recycled plastics, concrete)"
              required // Marked as required
            />
          </div>
        );
      case ConfigPhase.FINAL_DETAILS:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white flex items-center mb-4">
              <Scale className="w-5 h-5 mr-2 text-blue-400" />
              Budget & Final Notes
            </h3>
            <AutocompleteInputField 
              label="Estimated Budget" 
              value={requirements.estimatedBudget} 
              onChange={(e) => updateRequirements('estimatedBudget', e.target.value)} 
              onSuggestionSelected={(value) => updateRequirements('estimatedBudget', value)}
              suggestions={budgetSuggestions}
              placeholder="e.g. Low, Medium, High, $10K-$20K" 
              icon={Scale}
              required={false} // Now optional
            />
            <InputField 
              label="References or Examples (Links/Description)" 
              value={requirements.references} 
              onChange={(e) => updateRequirements('references', e.target.value)} 
              placeholder="e.g. https://example.com/booth1, sleek modern design" 
              rows={3}
              required={false} // Now optional
            />
            <InputField 
              label="Final Notes / Specific Requirements" 
              value={requirements.additionalNotes} 
              onChange={(e) => updateRequirements('additionalNotes', e.target.value)} 
              placeholder="Describe any specific layout needs, visitor flow, or vibe..." 
              rows={3}
              required={false} // Now optional
            />
          </div>
        );
      default:
        return null;
    }
  };

  const progressPercentage = ((currentPhaseIndex + 1) / phases.length) * 100;

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-6 shadow-xl">
      <h2 className="text-xl font-semibold text-white mb-6 flex items-center">
        <Layers className="w-5 h-5 mr-2 text-blue-500" />
        Design Configuration
      </h2>

      {/* Progress Indicator */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-slate-400 mb-2">
          <span>Step {currentPhaseIndex + 1} of {phases.length}</span>
          <span>{currentPhase}</span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-6">
        {renderPhaseContent()}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-slate-700">
          {!isFirstPhase && (
            <button
              type="button"
              onClick={handlePrevious}
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isAnyGenerating}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
          )}

          {isLastPhase ? (
            <button
              type="submit"
              disabled={isAnyGenerating || !validateAllRequiredPhases()}
              className={`flex items-center justify-center space-x-2 py-3.5 px-6 rounded-lg text-white font-semibold transition-all shadow-lg ml-auto 
                ${isAnyGenerating || !validateAllRequiredPhases()
                  ? 'bg-slate-700 cursor-not-allowed text-slate-400'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/25'
                }
              `}
              aria-label={"Generate Design"}
            >
              {isAnyGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-400 border-t-transparent" />
                  <span>Generating Concept...</span>
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5" />
                  <span>Generate Design</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-white transition-colors ml-auto ${
                validateCurrentPhase()
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-slate-700 cursor-not-allowed text-slate-400'
              }`}
              disabled={isAnyGenerating || !validateCurrentPhase()}
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ConfigurationForm;