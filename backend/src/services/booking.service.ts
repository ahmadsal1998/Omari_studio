import Booking from '../models/Booking.model';
import Service from '../models/Service.model';
import Product from '../models/Product.model';

export const calculateBookingTotals = async (
  services: Array<{ service: string; quantity: number }>,
  products?: Array<{ product: string; quantity: number }>,
  discount: number = 0
) => {
  let totalSellingPrice = 0;
  let totalCost = 0;

  // Calculate services totals
  for (const item of services) {
    if (!item.service || !item.quantity) {
      throw new Error('Invalid service data: service ID and quantity are required');
    }
    const service = await Service.findById(item.service);
    if (!service) {
      throw new Error(`Service ${item.service} not found`);
    }
    totalSellingPrice += service.sellingPrice * item.quantity;
    totalCost += service.costPrice * item.quantity;
  }

  // Calculate products totals
  if (products && products.length > 0) {
    for (const item of products) {
      if (!item.product || !item.quantity) {
        throw new Error('Invalid product data: product ID and quantity are required');
      }
      const product = await Product.findById(item.product);
      if (!product) {
        throw new Error(`Product ${item.product} not found`);
      }
      totalSellingPrice += product.sellingPrice * item.quantity;
      totalCost += product.costPrice * item.quantity;
    }
  }

  // Apply discount
  totalSellingPrice = Math.max(0, totalSellingPrice - discount);

  const profit = totalSellingPrice - totalCost;

  return {
    totalSellingPrice,
    totalCost,
    profit,
  };
};
