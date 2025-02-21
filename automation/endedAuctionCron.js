import cron from "node-cron";
import { Auction } from "../models/auctionSchema.js";
import { User } from "../models/userSchema.js";
import { Bid } from "../models/bidSchema.js";
import { sendEmail } from "../utils/sendEmail.js";



export const endedAuctionCron = () => {
  cron.schedule("*/1 * * * *", async () => {
    const now = new Date();

    const endedAuctions = await Auction.find({
      endTime: { $lt: now },
      commissionCalculated: true,
    });
    for (const auction of endedAuctions) {
      try {

        auction.commissionCalculated = true;
        const highestBidder = await Bid.findOne({
          auctionItem: auction._id,
          amount: auction.currentBid,
        });
        const auctioneer = await User.findById(auction.createdBy);
        
        if (highestBidder) {
          auction.highestBidder = highestBidder.bidder.id;
          await auction.save();
          const bidder = await User.findById(highestBidder.bidder.id);
          await User.findByIdAndUpdate(
            bidder._id,
            {
              $inc: {
                moneySpent: highestBidder.amount,
                auctionsWon: 1,
              },
            },
            { new: true }
          );
         
          const subject = `Congratulations! You won the auction for ${auction.title}`;
          const message = `Dear ${bidder.userName}, \n\nCongratulations! You have won the auction ntac\n\n:\n\nWe are pleased to inform you that your bid has been higher value in the auction.So your bid was selected as the winning proposal,We have announced you are the winner of the auction.\n\n`;
          console.log("SENDING EMAIL TO HIGHEST BIDDER");
          sendEmail({ email: bidder.email, subject, message });
          console.log("SUCCESSFULLY EMAIL SEND TO HIGHEST BIDDER");
        } else {
          await auction.save();
        }
      } catch (error) {
        return next(console.error(error || "Some error in ended auction cron"));
      }
    }
  });
};
