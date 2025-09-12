import { useTheme } from "../context/ThemeContext";

export default function Settings() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-surface rounded-xl shadow-sm p-6 border border-border">
        <h2 className="text-xl font-semibold mb-2">Theme Settings</h2>
        <p className="text-gray-500 mb-6">Customize the appearance of your dashboard</p>
        
        <div className="space-y-6">
          <div>
            <label className="block mb-2 font-medium">Primary Color</label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={`#${theme.primary
                  .split(" ")
                  .map((c: string) => Number(c).toString(16).padStart(2, "0"))
                  .join("")}`}
                onChange={(e) => {
                  const hex = e.target.value;
                  const rgb = [
                    parseInt(hex.slice(1, 3), 16),
                    parseInt(hex.slice(3, 5), 16),
                    parseInt(hex.slice(5, 7), 16),
                  ].join(" ");
                  setTheme({ ...theme, primary: rgb });
                }}
                className="w-12 h-12 cursor-pointer rounded-lg border border-border"
              />
              <div className="flex-1">
                <div className="text-sm text-gray-500 mb-1">Used for primary actions and links</div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-sm bg-primary"></div>
                  <span className="text-sm font-mono">rgb({theme.primary})</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block mb-2 font-medium">Tertiary Color</label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={`#${theme.tertiary
                  .split(" ")
                  .map((c: string) => Number(c).toString(16).padStart(2, "0"))
                  .join("")}`}
                onChange={(e) => {
                  const hex = e.target.value;
                  const rgb = [
                    parseInt(hex.slice(1, 3), 16),
                    parseInt(hex.slice(3, 5), 16),
                    parseInt(hex.slice(5, 7), 16),
                  ].join(" ");
                  setTheme({ ...theme, tertiary: rgb });
                }}
                className="w-12 h-12 cursor-pointer rounded-lg border border-border"
              />
              <div className="flex-1">
                <div className="text-sm text-gray-500 mb-1">Used for success states and positive indicators</div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-sm bg-tertiary"></div>
                  <span className="text-sm font-mono">rgb({theme.tertiary})</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}