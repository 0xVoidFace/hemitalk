import cn from "@/helpers/cn";

interface SmallSingleAccountShimmerProps {
  hideSlug?: boolean;
  smallAvatar?: boolean;
}

const SmallSingleAccountShimmer = ({
  hideSlug = false,
  smallAvatar = false
}: SmallSingleAccountShimmerProps) => {
  return (
    <div className="flex items-center space-x-3">
      <div
        className={cn(
          smallAvatar ? "size-4" : "size-6",
          "shimmer rounded-full"
        )}
      />
      <div className="shimmer h-3 w-28 rounded-lg" />
      {!hideSlug && <div className="shimmer h-3 w-20 rounded-lg" />}
    </div>
  );
};

export default SmallSingleAccountShimmer;
