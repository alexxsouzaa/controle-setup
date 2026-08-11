import {
  type LucideIcon,
  type LucideProps,
  HomeIcon,
  FileIcon,
  WrenchIcon,
  PlusIcon,
  SearchIcon,
  SunIcon,
  MoonIcon,
  ArrowRightIcon,
  DownloadIcon,
  UploadIcon,
  ClockIcon,
  SettingsIcon,
  BoxIcon,
  Grid3X3Icon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  PencilIcon,
  Trash2Icon,
} from 'lucide-react';

interface IconProps extends LucideProps {
  name: string;
}

const ICONS: Record<string, LucideIcon> = {
  home: HomeIcon,
  file: FileIcon,
  wrench: WrenchIcon,
  plus: PlusIcon,
  search: SearchIcon,
  sun: SunIcon,
  moon: MoonIcon,
  'arrow-right': ArrowRightIcon,
  download: DownloadIcon,
  upload: UploadIcon,
  clock: ClockIcon,
  settings: SettingsIcon,
  box: BoxIcon,
  'grid-3x3': Grid3X3Icon,
  'check-circle': CheckCircle2Icon,
  alert: AlertTriangleIcon,
  edit: PencilIcon,
  trash: Trash2Icon,
};

export function Icon({ name, size = 20, ...props }: IconProps) {
  const Component = ICONS[name];
  if (!Component) return null;
  const { 'aria-label': ariaLabel, ...rest } = props;
  return (
    <Component
      size={size}
      aria-hidden={ariaLabel ? undefined : true}
      {...rest}
    />
  );
}
