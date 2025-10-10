import BoringComapny from "../models/trackingModel.js";
import Status from "../models/statusModel.js";
import fs from "fs";
import path from "path";
import { createCanvas } from "canvas";
import { sendMailSafe } from "../utils/mailer.js";

const generateLabel = async (tracking) => {
  try {
    const canvas = createCanvas(600, 600);
    const ctx = canvas.getContext("2d");

    // Brown cardboard background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, 600);
    gradient.addColorStop(0, "#d4a574");
    gradient.addColorStop(1, "#b8956a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 600, 600);

    // Dark brown header
    ctx.fillStyle = "#5d4e37";
    ctx.fillRect(0, 0, 600, 70);

    // Company name
    ctx.fillStyle = "#f5e6d3";
    ctx.font = "bold 28px Arial";
    ctx.fillText("BoringComapny ", 20, 45);

    // Border
    ctx.strokeStyle = "#5d4e37";
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, 580, 580);

    // Inner content area - lighter brown/tan
    ctx.fillStyle = "#f5e6d3";
    ctx.fillRect(20, 80, 560, 500);
    ctx.strokeStyle = "#a0826d";
    ctx.lineWidth = 1;
    ctx.strokeRect(20, 80, 560, 500);

    // Tracking number section
    ctx.fillStyle = "#e8d5bf";
    ctx.fillRect(30, 90, 540, 70);

    // Tracking number label
    ctx.fillStyle = "#5d4e37";
    ctx.font = "bold 18px Arial";
    ctx.fillText("TRACKING NUMBER", 40, 115);

    // Tracking number value
    ctx.fillStyle = "#2d2416";
    ctx.font = "bold 24px Arial";
    ctx.fillText(tracking.trackingNumber, 40, 145);

    // Barcode
    ctx.fillStyle = "#2d2416";
    const barcodeX = 300;
    const barcodeY = 105;
    const digits = tracking.trackingNumber.replace("TRK", "");
    for (let i = 0; i < digits.length; i++) {
      const width = 3 + (parseInt(digits[i]) % 3);
      const height = 30 + (parseInt(digits[i]) % 20);
      ctx.fillRect(barcodeX + i * 12, barcodeY, width, height);
    }

    // Ship to section
    ctx.fillStyle = "#5d4e37";
    ctx.font = "bold 16px Arial";
    ctx.fillText("SHIP TO:", 40, 190);

    ctx.fillStyle = "#2d2416";
    ctx.font = "15px Arial";

    if (tracking.customerInfo && tracking.customerInfo.name) {
      ctx.font = "bold 16px Arial";
      ctx.fillText(tracking.customerInfo.name, 40, 215);
      ctx.font = "15px Arial";

      if (tracking.customerInfo.address) {
        ctx.fillText(tracking.customerInfo.address, 40, 240);
      }

      if (tracking.customerInfo.phone) {
        ctx.fillText(`Phone: ${tracking.customerInfo.phone}`, 40, 265);
      }

      if (tracking.customerInfo.email) {
        ctx.fillText(`Email: ${tracking.customerInfo.email}`, 40, 290);
      }
    } else {
      ctx.fillText("Customer information not available", 40, 215);
    }

    // Shipping Details Section
    ctx.fillStyle = "#d4c4b0";
    ctx.fillRect(30, 320, 540, 150);

    ctx.fillStyle = "#5d4e37";
    ctx.font = "bold 16px Arial";
    ctx.fillText("SHIPPING DETAILS:", 40, 345);

    ctx.fillStyle = "#2d2416";
    ctx.font = "14px Arial";

    const additionalDetails = tracking.additionalDetails || {};

    // Sender Information
    ctx.fillText(
      `Sender Name: ${additionalDetails.senderName || "N/A"}`,
      40,
      370
    );
    ctx.fillText(
      `Sender Email: ${additionalDetails.senderEmail || "N/A"}`,
      40,
      390
    );

    // Financial Details
    ctx.fillText(
      `Shipping Fee: $${additionalDetails.shippingFee || "0.00"}`,
      40,
      410
    );
    ctx.fillText(`Tax Fee: $${additionalDetails.taxFee || "0.00"}`, 40, 430);
    ctx.fillText(
      `Total Fee: $${additionalDetails.totalFee || "0.00"}`,
      40,
      450
    );

    // Package Details
    ctx.fillText(
      `Package Weight: ${additionalDetails.packageWeight || "N/A"} kg`,
      40,
      470
    );
    ctx.fillText(
      `Invoice No: ${additionalDetails.invoiceNo || "N/A"}`,
      40,
      490
    );

    // Product section
    ctx.fillStyle = "#5d4e37";
    ctx.font = "bold 16px Arial";
    ctx.fillText("PRODUCT INFORMATION:", 300, 370);

    ctx.fillStyle = "#2d2416";
    ctx.font = "bold 15px Arial";
    ctx.fillText(tracking.productName, 300, 390);

    ctx.font = "13px Arial";
    if (tracking.productDescription) {
      const words = tracking.productDescription.split(" ");
      let line = "";
      let y = 410;
      words.forEach((word) => {
        const testLine = line + word + " ";
        if (ctx.measureText(testLine).width > 250) {
          ctx.fillText(line, 300, y);
          line = word + " ";
          y += 20;
        } else {
          line = testLine;
        }
      });
      ctx.fillText(line, 300, y);
    }

    // Date and status section
    ctx.fillStyle = "#5d4e37";
    ctx.font = "bold 14px Arial";
    ctx.fillText("ORDER DATE:", 300, 250);

    ctx.fillStyle = "#2d2416";
    ctx.font = "14px Arial";
    ctx.fillText(new Date(tracking.orderDate).toLocaleDateString(), 400, 250);

    if (tracking.expectedDeliveryDate) {
      ctx.fillStyle = "#5d4e37";
      ctx.font = "bold 14px Arial";
      ctx.fillText("EXPECTED DELIVERY:", 300, 270);

      ctx.fillStyle = "#2d2416";
      ctx.font = "14px Arial";
      ctx.fillText(
        new Date(tracking.expectedDeliveryDate).toLocaleDateString(),
        450,
        270
      );
    }

    // Status with color coding
    ctx.fillStyle = "#5d4e37";
    ctx.font = "bold 14px Arial";
    ctx.fillText("CURRENT STATUS:", 300, 290);

    // Status colors - kept colorful for visibility
    let statusColor;
    switch (tracking.currentStatus) {
      case "Ordered":
        statusColor = "#8b7355"; // muted brown
        break;
      case "Processing":
        statusColor = "#cd853f"; // peru/tan
        break;
      case "Ready to Ship":
        statusColor = "#d2691e"; // chocolate
        break;
      case "Shipped":
        statusColor = "#8b4513"; // saddle brown
        break;
      case "Out for Delivery":
        statusColor = "#a0522d"; // sienna
        break;
      case "Delivered":
        statusColor = "#228b22"; // forest green
        break;
      case "Cancelled":
        statusColor = "#8b0000"; // dark red
        break;
      default:
        statusColor = "#2d2416";
    }

    // Status background
    ctx.fillStyle = statusColor;
    const statusTextWidth = ctx.measureText(tracking.currentStatus).width;
    ctx.fillRect(400, 277, statusTextWidth + 20, 20);

    ctx.fillStyle = "#f5e6d3";
    ctx.font = "bold 14px Arial";
    ctx.fillText(tracking.currentStatus, 410, 290);

    // Bottom brown stripe
    ctx.fillStyle = "#5d4e37";
    ctx.fillRect(0, 590, 600, 10);

    // Thank you note
    ctx.fillStyle = "#5d4e37";
    ctx.font = "italic bold 14px Arial";
    ctx.fillText("Thank you for your business!", 220, 570);

    // Save the label
    const labelDir = path.join(process.cwd(), "labels");
    if (!fs.existsSync(labelDir)) {
      fs.mkdirSync(labelDir, { recursive: true });
    }

    const labelPath = path.join(labelDir, `${tracking.trackingNumber}.png`);
    const buffer = canvas.toBuffer("image/png");
    fs.writeFileSync(labelPath, buffer);

    return labelPath;
  } catch (error) {
    console.error("Error generating label:", error);
    return null;
  }
};

// Enhanced email template helper function
const createEmailTemplate = (type, data) => {
  const {
    tracking,
    status,
    notes,
    trackingNumber,
    productName,
    finalDeliveryDate,
  } = data;

  const statusMessages = {
    Ordered: "Your order has been confirmed and received",
    Processing: "Your order is being processed",
    "Ready to Ship": "Your order is ready to ship",
    Shipped: "Your order has been shipped",
    "Out for Delivery": "Your order is out for delivery",
    Delivered: "Your order has been delivered",
    Cancelled: "Your order has been cancelled",
  };

  const statusColors = {
    Ordered: "#3b82f6",
    Processing: "#f59e0b",
    "Ready to Ship": "#8b5cf6",
    Shipped: "#06b6d4",
    "Out for Delivery": "#10b981",
    Delivered: "#22c55e",
    Cancelled: "#ef4444",
  };

  const getStatusIcon = (status) => {
    const icons = {
      Ordered: "📦",
      Processing: "⚙️",
      "Ready to Ship": "✅",
      Shipped: "🚚",
      "Out for Delivery": "🚗",
      Delivered: "🎉",
      Cancelled: "❌",
    };
    return icons[status] || "📋";
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${
        type === "confirmation" ? "Order Confirmation" : "Order Update"
      }</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
          <td align="center">
            <!-- Main Container -->
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              
              <!-- Header with Gradient -->
              <tr>
                <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                    BoringComapny 
                  </h1>
                  <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 14px;">
                    Tracking & Delivery Service
                  </p>
                </td>
              </tr>

              <!-- Status Badge -->
              <tr>
                <td style="padding: 30px 30px 20px 30px; text-align: center;">
                  <div style="display: inline-block; background-color: ${
                    statusColors[status || tracking?.currentStatus]
                  }; color: #ffffff; padding: 12px 24px; border-radius: 50px; font-weight: 600; font-size: 16px;">
                    ${getStatusIcon(status || tracking?.currentStatus)} ${
    status || tracking?.currentStatus
  }
                  </div>
                </td>
              </tr>

              <!-- Main Message -->
              <tr>
                <td style="padding: 0 30px 30px 30px;">
                  <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 24px; font-weight: 600; text-align: center;">
                    ${
                      type === "confirmation"
                        ? "Order Confirmed!"
                        : "Order Status Update"
                    }
                  </h2>
<p style="margin: 0; color: #000000; font-size: 16px; line-height: 1.6; text-align: center;">
                    Hi <strong>${
                      tracking?.customerInfo?.name || "Customer"
                    }</strong>,
                  </p>
                  <p style="margin: 15px 0 0 0; color: #6b7280; font-size: 16px; line-height: 1.6; text-align: center;">
                    ${statusMessages[status || tracking?.currentStatus]}
                  </p>
                </td>
              </tr>

              <!-- Order Details Card -->
              <tr>
                <td style="padding: 0 30px 30px 30px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 12px; overflow: hidden;">
                    <tr>
                      <td style="padding: 25px;">
                        <h3 style="margin: 0 0 20px 0; color: #374151; font-size: 18px; font-weight: 600; border-bottom: 2px solid #d1d5db; padding-bottom: 10px;">
                          📋 Order Details
                        </h3>
                        
                        <!-- Tracking Number -->
                        <table width="100%" cellpadding="8" cellspacing="0">
                          <tr>
                            <td style="color: #6b7280; font-size: 14px; font-weight: 500;">Tracking Number:</td>
                            <td style="color: #111827; font-size: 14px; font-weight: 700; text-align: right;">
                              ${tracking?.trackingNumber || trackingNumber}
                            </td>
                          </tr>
                          <tr>
                            <td style="color: #6b7280; font-size: 14px; font-weight: 500;">Product:</td>
                            <td style="color: #111827; font-size: 14px; font-weight: 600; text-align: right;">
                              ${tracking?.productName || productName}
                            </td>
                          </tr>
                          ${
                            finalDeliveryDate || tracking?.expectedDeliveryDate
                              ? `
                          <tr>
                            <td style="color: #6b7280; font-size: 14px; font-weight: 500;">Expected Delivery:</td>
                            <td style="color: #10b981; font-size: 14px; font-weight: 700; text-align: right;">
                              ${new Date(
                                finalDeliveryDate ||
                                  tracking?.expectedDeliveryDate
                              ).toLocaleDateString("en-US", {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </td>
                          </tr>
                          `
                              : ""
                          }
                          ${
                            notes
                              ? `
                          <tr>
                            <td colspan="2" style="padding-top: 15px;">
                              <div style="background-color: #fff; padding: 12px; border-radius: 6px; border-left: 3px solid #667eea;">
                                <strong style="color: #374151; font-size: 13px;">Note:</strong>
                                <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 13px; line-height: 1.5;">${notes}</p>
                              </div>
                            </td>
                          </tr>
                          `
                              : ""
                          }
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- CTA Button -->
              <tr>
                <td style="padding: 0 30px 40px 30px; text-align: center;">
                  <a href="${process.env.FRONTEND_URL}/tracking/${
    tracking?.trackingNumber || trackingNumber
  }" 
                     style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); transition: all 0.3s;">
                    🔍 Track Your Order
                  </a>
                  <p style="margin: 15px 0 0 0; color: #9ca3af; font-size: 13px;">
                    Or copy this link: ${process.env.FRONTEND_URL}/tracking/${
    tracking?.trackingNumber || trackingNumber
  }
                  </p>
                </td>
              </tr>

              <!-- Divider -->
              <tr>
                <td style="padding: 0 30px;">
                  <div style="height: 1px; background: linear-gradient(90deg, transparent, #e5e7eb, transparent);"></div>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 30px; text-align: center;">
                  <p style="margin: 0 0 10px 0; color: #374151; font-size: 16px; font-weight: 600;">
                    Thank you for choosing BoringComapny ! 🙏
                  </p>
                  <p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.6;">
                    If you have any questions, please don't hesitate to contact our support team.
                  </p>
                  <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                      © ${new Date().getFullYear()} BoringComapny . All rights reserved.
                    </p>
                  </div>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

// Create a new tracking entry
export const createTracking = async (req, res) => {
  try {
    const {
      productName,
      productDescription,
      customerInfo,
      additionalDetails,
      senderName,
      senderEmail,
      shippingFee,
      taxFee,
      packageWeight,
      invoiceNo,
      expectedDeliveryDate,
      pickupLocation,
      deliveryLocation,
      deliveryDays = 3,
    } = req.body;

    if (!productName) {
      return res.status(400).json({
        success: false,
        message: "Product name is required",
      });
    }

    const trackingNumber = await BoringComapny.generateTrackingNumber();
    const totalFee = parseFloat(shippingFee || 0) + parseFloat(taxFee || 0);

    const orderDate = new Date();

    // Use provided date OR calculate it
    let finalDeliveryDate;
    if (expectedDeliveryDate) {
      finalDeliveryDate = new Date(expectedDeliveryDate);
    } else {
      finalDeliveryDate = new Date();
      finalDeliveryDate.setDate(orderDate.getDate() + parseInt(deliveryDays));
    }

    const tracking = new BoringComapny({
      trackingNumber,
      productName,
      productDescription,
      customerInfo,
      orderDate,
      expectedDeliveryDate: finalDeliveryDate,
      pickupLocation,
      deliveryLocation,
      additionalDetails: {
        ...additionalDetails,
        senderName,
        senderEmail,
        shippingFee: shippingFee || 0,
        taxFee: taxFee || 0,
        totalFee: totalFee.toFixed(2),
        packageWeight: packageWeight || 0,
        invoiceNo,
      },
      currentStatus: "Ordered",
      createdBy: req.admin._id,
    });

    await tracking.save();

    if (customerInfo && customerInfo.email) {
      try {
        await sendMailSafe({
          to: customerInfo.email,
          subject: `🎉 Order Confirmed - Tracking #${trackingNumber}`,
          html: createEmailTemplate("confirmation", {
            trackingNumber,
            productName,
            finalDeliveryDate,
            tracking: {
              trackingNumber,
              productName,
              expectedDeliveryDate: finalDeliveryDate,
              customerInfo,
              currentStatus: "Ordered",
            },
          }),
        });
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Tracking order created successfully",
      data: {
        trackingNumber: tracking.trackingNumber,
        currentStatus: tracking.currentStatus,
        orderDate: tracking.orderDate,
        expectedDeliveryDate: tracking.expectedDeliveryDate,
      },
    });
  } catch (error) {
    console.error("Error creating tracking:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create tracking order",
      error: error.message,
    });
  }
};

// Optional: Add a method to get tracking details
export const getTrackingDetails = async (req, res) => {
  try {
    const { trackingNumber } = req.params;

    const tracking = await BoringComapny.findOne({ trackingNumber }).populate(
      "createdBy",
      "name email"
    ); // If you want to include creator details

    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: "Tracking not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: tracking,
    });
  } catch (error) {
    console.error("Error fetching tracking details:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve tracking details",
      error: error.message,
    });
  }
};

// Optional: Method to update tracking status
export const updateTrackingStatus = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const { newStatus, notes } = req.body;

    const tracking = await BoringComapny.findOne({ trackingNumber });

    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: "Tracking not found",
      });
    }

    // Update current status
    tracking.currentStatus = newStatus;
    await tracking.save();

    // Create status history entry
    const statusUpdate = new Status({
      trackingId: tracking._id,
      status: newStatus,
      notes: notes || `Status updated to ${newStatus}`,
      updatedBy: req.admin._id,
    });
    await statusUpdate.save();

    if (tracking.customerInfo && tracking.customerInfo.email) {
      try {
        const statusMessages = {
          Processing: "Your order is being processed",
          "Ready to Ship": "Your order is ready to ship",
          Shipped: "Your order has been shipped",
          "Out for Delivery": "Your order is out for delivery",
          Delivered: "Your order has been delivered",
          Cancelled: "Your order has been cancelled",
        };

        await sendMailSafe({
          to: tracking.customerInfo.email,
          subject: `📦 Order Update - ${newStatus} - Tracking #${tracking.trackingNumber}`,
          html: createEmailTemplate("update", {
            tracking,
            status: newStatus,
            notes,
          }),
        });
      } catch (emailError) {
        console.error("Failed to send status update email:", emailError);
      }
    }

    res.status(200).json({
      success: true,
      message: "Tracking status updated successfully",
      data: {
        trackingNumber,
        newStatus,
      },
    });
  } catch (error) {
    console.error("Error updating tracking status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update tracking status",
      error: error.message,
    });
  }
};
// Get all tracking entries for admin
export const getAllTrackings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const trackings = await BoringComapny.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await BoringComapny.countDocuments();

    res.status(200).json({
      success: true,
      data: {
        trackings,
        pagination: {
          total,
          page,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching trackings:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching trackings",
      error: error.message,
    });
  }
};

// Get tracking by ID (admin view)
export const getTrackingById = async (req, res) => {
  try {
    const tracking = await BoringComapny.findById(req.params.id);

    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: "Tracking not found",
      });
    }

    // Get all status updates
    const statusUpdates = await Status.find({ trackingId: tracking._id }).sort({
      timestamp: -1,
    });

    res.status(200).json({
      success: true,
      data: {
        tracking,
        statusUpdates,
      },
    });
  } catch (error) {
    console.error("Error fetching tracking:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching tracking",
      error: error.message,
    });
  }
};

// Public tracking lookup by tracking number
// Public tracking lookup by tracking number
export const getTrackingByNumber = async (req, res) => {
  try {
    const { trackingNumber } = req.params;

    const tracking = await BoringComapny.findOne({ trackingNumber });

    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: "Tracking not found",
      });
    }

    // Get status history
    const statusUpdates = await Status.find({ trackingId: tracking._id }).sort({
      timestamp: -1,
    });

    res.status(200).json({
      success: true,
      data: {
        tracking: {
          trackingNumber: tracking.trackingNumber,
          productName: tracking.productName,
          productDescription: tracking.productDescription, // ADDED
          currentStatus: tracking.currentStatus,
          orderDate: tracking.orderDate,
          expectedDeliveryDate: tracking.expectedDeliveryDate,
          pickupLocation: tracking.pickupLocation, // ADDED
          deliveryLocation: tracking.deliveryLocation, // ADDED
          customerInfo: tracking.customerInfo, // ADDED
          additionalDetails: tracking.additionalDetails, // ADDED
        },
        statusUpdates: statusUpdates.map((update) => ({
          status: update.status,
          timestamp: update.timestamp,
          notes: update.notes,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching tracking:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching tracking",
      error: error.message,
    });
  }
};

// Manually update tracking status (admin only)
export const updateStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const tracking = await BoringComapny.findById(req.params.id);

    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: "Tracking not found",
      });
    }

    // Update current status
    tracking.currentStatus = status;
    await tracking.save();

    // Create new status entry
    const statusUpdate = new Status({
      trackingId: tracking._id,
      status,
      notes: notes || "",
      updatedBy: req.admin._id,
    });

    await statusUpdate.save();

    if (tracking.customerInfo && tracking.customerInfo.email) {
      try {
        const statusMessages = {
          Processing: "Your order is being processed",
          "Ready to Ship": "Your order is ready to ship",
          Shipped: "Your order has been shipped",
          "Out for Delivery": "Your order is out for delivery",
          Delivered: "Your order has been delivered",
          Cancelled: "Your order has been cancelled",
        };

        await sendMailSafe({
          to: tracking.customerInfo.email,
          subject: `📦 Order Update - ${status} - Tracking #${tracking.trackingNumber}`,
          html: createEmailTemplate("update", {
            tracking,
            status,
            notes,
          }),
        });
      } catch (emailError) {
        console.error("Failed to send status update email:", emailError);
      }
    }

    res.status(200).json({
      success: true,
      message: "Status updated successfully",
      data: {
        tracking: {
          _id: tracking._id,
          trackingNumber: tracking.trackingNumber,
          currentStatus: tracking.currentStatus,
        },
        statusUpdate: {
          status: statusUpdate.status,
          timestamp: statusUpdate.timestamp,
          notes: statusUpdate.notes,
        },
      },
    });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({
      success: false,
      message: "Error updating status",
      error: error.message,
    });
  }
};

// Get shipping label
export const getShippingLabel = async (req, res) => {
  try {
    const { trackingNumber } = req.params;

    const tracking = await BoringComapny.findOne({ trackingNumber });

    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: "Tracking not found",
      });
    }

    const labelPath = path.join(
      process.cwd(),
      "labels",
      `${trackingNumber}.png`
    );

    if (!fs.existsSync(labelPath)) {
      // If label doesn't exist, generate it
      const newLabelPath = await generateLabel(tracking);

      if (!newLabelPath) {
        return res.status(500).json({
          success: false,
          message: "Error generating shipping label",
        });
      }
    }

    return res.sendFile(labelPath);
  } catch (error) {
    console.error("Error fetching shipping label:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching shipping label",
      error: error.message,
    });
  }
};

// Cancel order (admin only)
export const cancelOrder = async (req, res) => {
  try {
    const { notes } = req.body;

    const tracking = await BoringComapny.findById(req.params.id);

    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: "Tracking not found",
      });
    }

    // Check if already delivered or cancelled
    if (tracking.currentStatus === "Delivered") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a delivered order",
      });
    }

    if (tracking.currentStatus === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Order is already cancelled",
      });
    }

    // Update to cancelled
    tracking.currentStatus = "Cancelled";
    await tracking.save();

    // Create status history
    const statusUpdate = new Status({
      trackingId: tracking._id,
      status: "Cancelled",
      notes: notes || "Order cancelled by admin",
      updatedBy: req.admin._id,
    });

    await statusUpdate.save();

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: {
        tracking: {
          _id: tracking._id,
          trackingNumber: tracking.trackingNumber,
          currentStatus: tracking.currentStatus,
        },
        statusUpdate: {
          status: statusUpdate.status,
          timestamp: statusUpdate.timestamp,
          notes: statusUpdate.notes,
        },
      },
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({
      success: false,
      message: "Error cancelling order",
      error: error.message,
    });
  }
};

// Reactivate cancelled order (optional)
export const reactivateOrder = async (req, res) => {
  try {
    const { notes } = req.body;

    const tracking = await BoringComapny.findById(req.params.id);

    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: "Tracking not found",
      });
    }

    if (tracking.currentStatus !== "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Only cancelled orders can be reactivated",
      });
    }

    // Revert to Ordered status
    tracking.currentStatus = "Ordered";
    await tracking.save();

    // Create status history
    const statusUpdate = new Status({
      trackingId: tracking._id,
      status: "Ordered",
      notes: notes || "Order reactivated by admin",
      updatedBy: req.admin._id,
    });

    await statusUpdate.save();

    res.status(200).json({
      success: true,
      message: "Order reactivated successfully",
      data: {
        tracking: {
          _id: tracking._id,
          trackingNumber: tracking.trackingNumber,
          currentStatus: tracking.currentStatus,
        },
      },
    });
  } catch (error) {
    console.error("Error reactivating order:", error);
    res.status(500).json({
      success: false,
      message: "Error reactivating order",
      error: error.message,
    });
  }
};

// Send custom email to customer (admin only)
export const sendCustomEmail = async (req, res) => {
  try {
    const { trackingNumber, subject, message } = req.body;

    // Validation
    if (!trackingNumber || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Tracking number, subject, and message are required",
      });
    }

    // Find the tracking to get customer email
    const tracking = await BoringComapny.findOne({ trackingNumber });

    if (!tracking) {
      return res.status(404).json({
        success: false,
        message: "Tracking not found",
      });
    }

    if (!tracking.customerInfo || !tracking.customerInfo.email) {
      return res.status(400).json({
        success: false,
        message: "Customer email not found",
      });
    }

    // Create custom email template
    const customEmailTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <!-- Main Container -->
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                
                <!-- Header with Gradient -->
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                       BoringComapny
                    </h1>
                    <p style="margin: 10px 0 0 0; color: #e0e7ff; font-size: 14px;">
                      Tracking & Delivery Service
                    </p>
                  </td>
                </tr>

                <!-- Main Message -->
                <tr>
                  <td style="padding: 40px 30px 30px 30px;">
                    <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 24px; font-weight: 600; text-align: center;">
                      ${subject}
                    </h2>
                    <p style="margin: 0; color: #6b7280; font-size: 16px; line-height: 1.6; text-align: center;">
                      Hi <strong>${
                        tracking.customerInfo.name || "Customer"
                      }</strong>,
                    </p>
                  </td>
                </tr>

                <!-- Message Content -->
              <tr>
  <td style="padding: 0 30px 30px 30px;">
    <div style="background: #ffffff; border-radius: 12px; padding: 25px; border: 1px solid #e5e7eb;">
      <div style="color: #000000; font-size: 15px; line-height: 1.8; white-space: pre-wrap;">
        ${message}
      </div>
    </div>
  </td>
</tr>

                <!-- Order Reference -->
                <tr>
                  <td style="padding: 0 30px 30px 30px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px;">
                      <tr>
                        <td style="padding: 15px 20px;">
                          <p style="margin: 0; color: #92400e; font-size: 13px; font-weight: 500;">
                            <strong>Related Order:</strong> ${trackingNumber}
                          </p>
                          <p style="margin: 5px 0 0 0; color: #92400e; font-size: 13px;">
                            Product: ${tracking.productName}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Track Order Button -->
                <tr>
                  <td style="padding: 0 30px 40px 30px; text-align: center;">
                    <a href="${
                      process.env.FRONTEND_URL
                    }/tracking/${trackingNumber}" 
                       style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);">
                      Track Your Order
                    </a>
                    <p style="margin: 15px 0 0 0; color: #9ca3af; font-size: 13px;">
                      Or copy this link: ${
                        process.env.FRONTEND_URL
                      }/tracking/${trackingNumber}
                    </p>
                  </td>
                </tr>

                <!-- Divider -->
                <tr>
                  <td style="padding: 0 30px;">
                    <div style="height: 1px; background: linear-gradient(90deg, transparent, #e5e7eb, transparent);"></div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 30px; text-align: center;">
                    <p style="margin: 0 0 10px 0; color: #374151; font-size: 16px; font-weight: 600;">
                      Thank you for choosing BoringComapnybal!
                    </p>
                    <p style="margin: 0; color: #9ca3af; font-size: 13px; line-height: 1.6;">
                      If you have any questions, please don't hesitate to contact our support team.
                    </p>
                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                      <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                        © ${new Date().getFullYear()} BoringComapny. All rights reserved.
                      </p>
                    </div>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Send email
    await sendMailSafe({
      to: tracking.customerInfo.email,
      subject: subject,
      html: customEmailTemplate,
    });

    res.status(200).json({
      success: true,
      message: "Email sent successfully",
      data: {
        sentTo: tracking.customerInfo.email,
        trackingNumber: tracking.trackingNumber,
        customerName: tracking.customerInfo.name,
      },
    });
  } catch (error) {
    console.error("Error sending custom email:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send email",
      error: error.message,
    });
  }
};


// Contact form submission (public)
export const submitContactForm = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    console.log("=== CONTACT FORM SUBMISSION ===");
    console.log("Form data received:", { name, email, subject });

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Admin notification email
    const adminEmailTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contact Form from ${name}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f7f7f7;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-align: center; padding: 20px;">
            <h1 style="margin: 0; font-size: 24px; font-weight: bold;">New Message from ${name}</h1>
            <p style="margin: 5px 0; font-size: 18px; font-weight: bold;">${email}</p>
            <p style="margin: 5px 0; font-size: 14px;">Contact Form Submission</p>
          </div>
          
          <div style="padding: 20px;">
            <div style="background-color: #e6f3ff; border-left: 4px solid #667eea; padding: 15px; margin-bottom: 20px;">
              <p style="margin: 0; font-size: 16px; font-weight: bold; color: #667eea;">
                Click "Reply" to respond directly to ${name} at ${email}
              </p>
            </div>
            
            <h2 style="font-size: 20px; color: #667eea; margin-bottom: 16px;">Contact Details</h2>
            
            <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 16px; border: 2px solid #667eea;">
              <h3 style="margin: 0 0 15px 0; color: #667eea; font-size: 18px;">Customer Information:</h3>
              <p style="margin: 8px 0; font-size: 16px;"><strong>Name:</strong> ${name}</p>
              <p style="margin: 8px 0; font-size: 16px;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #667eea; text-decoration: none; font-weight: bold;">${email}</a></p>
              <p style="margin: 8px 0; font-size: 16px;"><strong>Subject:</strong> ${subject}</p>
            </div>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 16px;">
              <h3 style="margin: 0 0 10px 0; color: #333;">Message:</h3>
              <div style="background-color: white; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea;">
                <p style="margin: 0; white-space: pre-wrap; font-size: 15px; line-height: 1.6; color: #000000;">${message}</p>
              </div>
            </div>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="mailto:${email}?subject=Re: ${subject}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 16px; font-weight: bold;">
                Reply to ${name}
              </a>
            </div>
            
            <p style="font-size: 14px; color: #666;">
              Submitted at: ${new Date().toLocaleString()}
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; background-color: #f7f7f7; font-size: 14px; color: #666;">
            <p style="margin: 0;">BoringComapny  Customer Service</p>
            <p style="margin: 5px 0 0 0;">This message was sent via the contact form by ${name} (${email})</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const adminMailOptions = {
      to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
      subject: `[CUSTOMER MESSAGE] ${name}: ${subject}`,
      html: adminEmailTemplate,
      replyTo: `"${name}" <${email}>`,
    };

    console.log("Sending admin email...");
    await sendMailSafe(adminMailOptions);

    // Customer confirmation email
    const customerEmailTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Message Received - BoringComapny </title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f7f7f7;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-align: center; padding: 20px;">
            <h1 style="margin: 0; font-size: 24px; font-weight: bold;">BoringComapny </h1>
            <p style="margin: 5px 0; font-size: 14px;">Message Received</p>
          </div>
          <div style="padding: 20px;">
            <h2 style="font-size: 20px; color: #667eea; margin-bottom: 16px;">Thank You for Contacting Us</h2>
            
            <p style="font-size: 16px; margin-bottom: 16px; color: #000000;">Hello ${name},</p>
            
            <p style="font-size: 16px; margin-bottom: 16px; color: #000000;">
              We have received your message and will respond within 24 hours during business days.
            </p>
            
            <div style="background-color: #f0f9ff; border: 1px solid #667eea; padding: 15px; border-radius: 8px; margin-bottom: 16px;">
              <h3 style="margin: 0 0 10px 0; color: #667eea;">Your Message Summary:</h3>
              <p style="margin: 5px 0; color: #000000;"><strong>Subject:</strong> ${subject}</p>
              <p style="margin: 5px 0; color: #000000;"><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <p style="font-size: 16px; margin-bottom: 16px; color: #000000;">
              Best regards,<br>
               BoringComapny Customer Service Team
            </p>
          </div>
          <div style="text-align: center; padding: 20px; background-color: #f7f7f7; font-size: 14px; color: #666;">
            <p style="margin: 0;">BoringComapny </p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendMailSafe({
      to: email,
      subject: "Message Received - BoringComapny ",
      html: customerEmailTemplate,
    });

    return res.status(200).json({
      success: true,
      message: "Message sent successfully. We will respond within 24 hours.",
    });
  } catch (err) {
    console.error("Contact form error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: err.message,
    });
  }
};