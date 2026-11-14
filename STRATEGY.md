Persistence forecast with a random-walk spread, scaled by price level (0.3 + 2*min(x,1-x)) and sigma 0.005 per sqrt minute.
Checked on the 24 dev series over three separate time windows: it beat the plain 0.0025 persistence baseline in all three (pinball loss 1.56 vs 1.63, 1.90 to 1.96 vs 2.06, 0.36 to 0.38 vs 0.42; 1.096 vs 1.164 overall).
A volatility-adaptive spread was tried and was much worse, so it was dropped.
