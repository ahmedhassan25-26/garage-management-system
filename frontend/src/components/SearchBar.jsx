import { Search, X } from "lucide-react";

const SearchBar = ({ value, onChange, placeholder, className }) => {
  return (
    <div className={`search-box compact-search ${className || ""}`}>
      <Search size={16} />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {value && (
        <button
          className="clear-search"
          onClick={() => onChange("")}
          aria-label="Clear search"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
};

export default SearchBar;