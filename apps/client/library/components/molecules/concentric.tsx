import Circle from "../atoms/circle";

interface ConcentricProps {
  size: number;
}

const Concentric = ({ size }: ConcentricProps) => {
  const sizes = Array.from({ length: size }, (_, i) => 150 + i * 100);

  return (
    <>
      {sizes.map((size, index) => (
        <Circle key={index} size={size} opacity={1 - index * 0.08} />
      ))}
    </>
  );
};

export default Concentric;
