interface CircleProps {
  size: number;
  opacity: number;
}

const Circle = ({ size, opacity }: CircleProps) => {
  return (
    <div
      style={{
        position: "absolute",
        top: "-5%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        border: "2px solid #DDD8DC",
        opacity: opacity,
        zIndex: "-1",
      }}
    />
  );
};

export default Circle;
