
interface Props{
    children:string
    onClick: ()=>void
}

const Button = ({children, onClick}:Props) => {
    return (
     <button onClick={onClick}>{children}</button>
    )
}
export default Button;