export default function UIButton({
    children,
    color = "blue",
    className = "",
    ...props
  }: any) {
    const map: any = {
      blue: "bg-[#3A4E7A]",
      pink: "bg-[#D48F8F]",
      gray: "bg-gray-300",
    };
  
    return (
      <button
        {...props}
        className={`
          ${map[color]} text-white text-2xl font-bold
          px-10 py-4 rounded-2xl shadow-md
          active:scale-95 transition
          ${className}
        `}
      >
        {children}
      </button>
    );
  }
  