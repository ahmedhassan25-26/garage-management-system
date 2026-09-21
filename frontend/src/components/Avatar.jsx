const AVATAR_COLORS = [
  ["#eff6ff", "#1d4ed8"],
  ["#f2edff", "#6d28d9"],
  ["#ecfdf5", "#047857"],
  ["#fff7ed", "#c2410c"],
  ["#ecfeff", "#0e7490"],
  ["#fef2f2", "#b91c1c"],
  ["#f5f3ff", "#7c3aed"],
  ["#eef2ff", "#4338ca"],
];

const initialsFor = (name = "") => {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "?";

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (
    parts[0][0] + parts[parts.length - 1][0]
  ).toUpperCase();
};

const colorFor = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) % 997;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
};

const Avatar = ({
  name,
  size = 38,
  rounded = "circular",
  icon: Icon,
}) => {
  const [bg, fg] = colorFor(name || "");

  const style = {
    width: size,
    height: size,
    backgroundColor: bg,
    color: fg,
    fontSize: Math.max(10, size * 0.38),
  };

  const className = `avatar ${rounded === "square" ? "avatar-square" : ""}`;

  return (
    <div className={className} style={style} aria-hidden="true">
      {Icon ? <Icon size={size * 0.5} /> : initialsFor(name)}
    </div>
  );
};

export default Avatar;