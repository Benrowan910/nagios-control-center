import { WidthProvider, Responsive } from "react-grid-layout";
import { useState, useEffect } from "react";

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function GridLayout({ children, onLayoutChange }) {
  const [layout, setLayout] = useState([]);

  // Load layout from localStorage on component mount
  useEffect(() => {
    const savedLayout = localStorage.getItem('dashlet-layout');
    if (savedLayout) {
      setLayout(JSON.parse(savedLayout));
    }
  }, []);

  const handleLayoutChange = (newLayout) => {
    setLayout(newLayout);
    localStorage.setItem('dashlet-layout', JSON.stringify(newLayout));
    if (onLayoutChange) {
      onLayoutChange(newLayout);
    }
  };

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={{ lg: layout }}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
      rowHeight={200}
      onLayoutChange={handleLayoutChange}
      isDraggable={true}
      isResizable={false}
      margin={[20, 20]}
    >
      {children}
    </ResponsiveGridLayout>
  );
}