from typing import Dict, Any

class CurrencyService:
    """
    Abstraction layer for multi-currency operations.
    Can be hooked into an external API (like fixer.io or European Central Bank)
    in the future. For now, provides a configurable stub.
    """
    def __init__(self):
        # Stub rates relative to base INR
        self.stub_rates = {
            "INR": 1.0,
            "USD": 0.012,
            "EUR": 0.011,
            "GBP": 0.0095
        }

    def convert(self, amount: float, from_currency: str, to_currency: str) -> float:
        """Converts an amount from one currency to another."""
        if from_currency == to_currency:
            return amount
            
        from_rate = self.stub_rates.get(from_currency.upper())
        to_rate = self.stub_rates.get(to_currency.upper())
        
        if not from_rate or not to_rate:
            raise ValueError(f"Exchange rate not configured for {from_currency} or {to_currency}")
            
        # Convert to base (INR), then to target
        inr_amount = amount / from_rate
        target_amount = inr_amount * to_rate
        
        return round(target_amount, 2)
