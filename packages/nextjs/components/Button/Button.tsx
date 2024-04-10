import React, { ReactNode } from 'react';

interface ButtonProps {
    onClick: () => void;
    children: ReactNode;
}

const Button: React.FC<ButtonProps> = ({ onClick, children }) => {
    return (
        <button className="py-[10px] px-[20px] bg-[#0C0C4F] text-white rounded-[8px]" onClick={onClick} type="button">
            {children}
        </button>
    );
};

export default Button;
