import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookOpen,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Compass,
  Download,
  Expand,
  FileText,
  Headphones,
  Heart,
  History,
  Lightbulb,
  Link,
  Menu,
  Moon,
  Newspaper,
  Radar,
  Rss,
  Search,
  Settings,
  Share2,
  SlidersHorizontal,
  Sun,
  X,
  Zap,
  Box,
  Clock,
  ExternalLink,
  Save,
  Star,
  Activity,
  RefreshCw,
  Plus,
  Trash2,
  Pencil,
  ShieldCheck,
  Scale,
  Network,
} from 'lucide-react';

const icons = {
  arrowLeft: ArrowLeft,
  arrowRight: ArrowRight,
  bookmark: Bookmark,
  book: BookOpen,
  calendar: CalendarDays,
  check: Check,
  checks: CheckCheck,
  down: ChevronDown,
  left: ChevronLeft,
  right: ChevronRight,
  compass: Compass,
  download: Download,
  expand: Expand,
  summary: FileText,
  headphones: Headphones,
  heart: Heart,
  history: History,
  bulb: Lightbulb,
  link: Link,
  menu: Menu,
  moon: Moon,
  newspaper: Newspaper,
  radar: Radar,
  rss: Rss,
  search: Search,
  settings: Settings,
  share: Share2,
  filter: SlidersHorizontal,
  sun: Sun,
  close: X,
  bolt: Zap,
  logo: Box,
  clock: Clock,
  external: ExternalLink,
  save: Save,
  star: Star,
  timeline: Activity,
  refresh: RefreshCw,
  plus: Plus,
  trash: Trash2,
  edit: Pencil,
  shield: ShieldCheck,
  scale: Scale,
  network: Network,
};
export function Icon({ name, size = 16, ...props }) {
  const Component = icons[name] || FileText;
  return <Component size={size} strokeWidth={1.65} aria-hidden="true" {...props} />;
}
export function SignalDeskLogo({ className = 'w-6 h-6 text-primary' }) {
  return (
    <div
      className={`flex items-center justify-center transition-transform duration-200 group-hover:scale-105 ${className}`}
    >
      <svg
        className="w-full h-full"
        fill="none"
        viewBox="0 0 48 48"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          clipRule="evenodd"
          d="M24 18.4228L42 11.475V34.3663C42 34.7796 41.7457 35.1504 41.3601 35.2992L24 42V18.4228Z"
          fill="currentColor"
          fillRule="evenodd"
        />
        <path
          clipRule="evenodd"
          d="M24 8.18819L33.4123 11.574L24 15.2071L14.5877 11.574L24 8.18819ZM9 15.8487L21 20.4805V37.6263L9 32.9945V15.8487ZM27 37.6263V20.4805L39 15.8487V32.9945L27 37.6263ZM25.354 2.29885C24.4788 1.98402 23.5212 1.98402 22.646 2.29885L4.98454 8.65208C3.7939 9.08038 3 10.2097 3 11.475V34.3663C3 36.0196 4.01719 37.5026 5.55962 38.098L22.9197 44.7987C23.6149 45.0671 24.3851 45.0671 25.0803 44.7987L42.4404 38.098C43.9828 37.5026 45 36.0196 45 34.3663V11.475C45 10.2097 44.2061 9.08038 43.0155 8.65208L25.354 2.29885Z"
          fill="currentColor"
          fillRule="evenodd"
        />
      </svg>
    </div>
  );
}

export function IconButton({ icon, label, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`icon-button ${className}`}
      title={label}
      aria-label={label}
      {...props}
    >
      <Icon name={icon} />
    </button>
  );
}
export function EmptyState({
  title = '没有找到匹配的情报',
  detail = '尝试其他关键词，或清空筛选条件。',
  onReset,
}) {
  return (
    <div className="empty-state">
      <Icon name="search" size={28} />
      <h2>{title}</h2>
      <p>{detail}</p>
      {onReset && (
        <button className="button" onClick={onReset}>
          清空搜索条件
        </button>
      )}
    </div>
  );
}
export function SectionTitle({ icon, children, detail }) {
  return (
    <div className="section-title">
      <span>
        <Icon name={icon} />
        {children}
      </span>
      {detail && <small>{detail}</small>}
    </div>
  );
}
