import React, { ReactNode } from 'react';

interface ButtonProps {
    onClick: () => void;
    children: ReactNode;
}

const Button: React.FC<ButtonProps> = ({ onClick, children }) => {
    return (
        <button className="py-[10px] px-[20px] bg-base-300 text-base-100 rounded-[8px]" onClick={onClick} type="button">
            {children}
        </button>
    );
};

export default Button;
