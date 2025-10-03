import { WidthProvider, Responsive } from "react-grid-layout";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function GridLayout({ children, onLayoutChange }) {
  const { id } = useParams();
  const [layout, setLayout] = useState([]);

  // Load layout from localStorage on component mount
  useEffect(() => {
    const layoutKey = id ? `instance-${id}-layout` : 'dashlet-layout';
    const savedLayout = localStorage.getItem(layoutKey);
    if (savedLayout) {
      setLayout(JSON.parse(savedLayout));
    }
  }, [id]);

  const handleLayoutChange = (newLayout) => {
    const layoutKey = id ? `instance-${id}-layout` : 'dashlet-layout';
    setLayout(newLayout);
    localStorage.setItem(layoutKey, JSON.stringify(newLayout));
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
      rowHeight={360}
      onLayoutChange={handleLayoutChange}
      isDraggable={true}
      isResizable={true}
      margin={[20, 20]}
    >
      {children}
    </ResponsiveGridLayout>
  );
}