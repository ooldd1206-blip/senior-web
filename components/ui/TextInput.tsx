import { InputHTMLAttributes } from "react";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export default function TextInput({ label, ...props }: TextInputProps) {
  return (
    <label className="block mb-6 text-2xl">
      <span className="block mb-2">{label}</span>
      <input
        {...props}
        className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-2xl"
      />
    </label>
  );
}
