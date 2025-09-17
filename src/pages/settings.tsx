import { useTheme } from "../context/ThemeContext";

export default function Settings() {
  const { theme, setTheme, resetTheme } = useTheme();

  const rgbToHex = (rgb: string): string => {
    const [r, g, b] = rgb.split(" ").map((c) => parseInt(c));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  const hexToRgb = (hex: string): string => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
      throw new Error("Invalid hex color");
    }
    return `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}`;
  };

  const handleColorChange = (colorKey: keyof typeof theme, hexValue: string) => {
    try {
      const rgbValue = hexToRgb(hexValue);
      setTheme({ ...theme, [colorKey]: rgbValue });
    } catch (error) {
      console.error("Invalid color value:", error);
    }
  };

  const ColorPicker = ({ label, colorKey, description }: { 
    label: string; 
    colorKey: keyof typeof theme;
    description: string;
  }) => (
    <div className="color-picker-group">
      <label className="block mb-2 font-medium">{label}</label>
      <div className="flex items-center gap-4">
        <input
          type="color"
          value={rgbToHex(theme[colorKey])}
          onChange={(e) => handleColorChange(colorKey, e.target.value)}
          className="w-12 h-12 cursor-pointer rounded-lg border border-border"
        />
        <div className="flex-1">
          <div className="text-sm text-muted mb-1">{description}</div>
          <div className="flex items-center gap-2">
            <div 
              className="w-5 h-5 rounded-sm" 
              style={{ 
                backgroundColor: `rgb(${theme[colorKey]})`,
                border: `1px solid rgba(255, 255, 255, 0.2)`
              }}
            ></div>
            <span className="text-sm font-mono">rgb({theme[colorKey]})</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="header">
        <h1>Theme Settings</h1>
        <p className="small">Customize the appearance of your dashboard</p>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Color Customization</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ColorPicker 
            label="Primary Color" 
            colorKey="primary" 
            description="Used for primary buttons and main actions" 
          />
          
          <ColorPicker 
            label="Secondary Color" 
            colorKey="secondary" 
            description="Used for secondary elements and highlights" 
          />
          
          <ColorPicker 
            label="Tertiary Color" 
            colorKey="tertiary" 
            description="Used for success states and positive indicators" 
          />
          
          <ColorPicker 
            label="Background Color" 
            colorKey="background" 
            description="Main background color of the application" 
          />
          
          <ColorPicker 
            label="Card Background" 
            colorKey="cardBackground" 
            description="Background color for cards and panels" 
          />
          
          <ColorPicker 
            label="Text Color" 
            colorKey="text" 
            description="Primary text color throughout the app" 
          />
          
          <ColorPicker 
            label="Border Color" 
            colorKey="border" 
            description="Color for borders and dividers" 
          />
          
          <ColorPicker 
            label="Success Color" 
            colorKey="success" 
            description="Color for success messages and indicators" 
          />
          
          <ColorPicker 
            label="Warning Color" 
            colorKey="warning" 
            description="Color for warning messages and indicators" 
          />
          
          <ColorPicker 
            label="Error Color" 
            colorKey="error" 
            description="Color for error messages and indicators" 
          />
        </div>
        
        <div className="mt-6 pt-4 border-t border-border">
          <button 
            onClick={resetTheme}
            className="btn btn-secondary"
          >
            Reset to Default Theme
          </button>
        </div>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Theme Preview</h2>
        
        <div className="preview-grid">
          <div className="preview-item">
            <div className="preview-label">Primary Button</div>
            <button className="btn btn-primary">Action</button>
          </div>
          
          <div className="preview-item">
            <div className="preview-label">Secondary Button</div>
            <button className="btn btn-secondary">Action</button>
          </div>
          
          <div className="preview-item">
            <div className="preview-label">Status Indicators</div>
            <div className="flex gap-2">
              <span className="badge OK">OK</span>
              <span className="badge WARNING">Warning</span>
              <span className="badge CRITICAL">Critical</span>
            </div>
          </div>
          
          <div className="preview-item">
            <div className="preview-label">Text Samples</div>
            <div>
              <p>Regular text</p>
              <p className="text-muted">Muted text</p>
            </div>
          </div>
          
          <div className="preview-item">
            <div className="preview-label">Card Example</div>
            <div className="preview-card">
              <h3>Sample Card</h3>
              <p>This is a preview of how cards will appear with your theme.</p>
            </div>
          </div>
          
          <div className="preview-item">
            <div className="preview-label">Form Elements</div>
            <div className="space-y-2">
              <input type="text" placeholder="Sample input" className="w-full" />
              <select className="w-full">
                <option>Sample dropdown</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}