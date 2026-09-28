import random

class BiasedMatrixFactorization:
    def __init__(self, num_factors=10, learning_rate=0.01, regularization=0.02, epochs=20):
        self.num_factors = num_factors
        self.lr = learning_rate
        self.reg = regularization
        self.epochs = epochs
        self.global_mean = 0.0
        self.user_biases = {}
        self.item_biases = {}
        self.user_factors = {}
        self.item_factors = {}

    def fit(self, ratings):
        # ratings: lista apo tuples (user_id, item_id, rating)
        if not ratings:
            return

        self.global_mean = sum(r for u, i, r in ratings) / len(ratings)

        # Arxikopoiisi
        for u, i, r in ratings:
            if u not in self.user_factors:
                self.user_factors[u] = [random.uniform(-0.1, 0.1) for _ in range(self.num_factors)]
                self.user_biases[u] = 0.0
            if i not in self.item_factors:
                self.item_factors[i] = [random.uniform(-0.1, 0.1) for _ in range(self.num_factors)]
                self.item_biases[i] = 0.0

        # Ekpaideusi me Stochastic Gradient Descent
        for epoch in range(self.epochs):
            for u, i, r in ratings:
                pred = self.global_mean + self.user_biases[u] + self.item_biases[i] + sum(
                    self.user_factors[u][k] * self.item_factors[i][k] for k in range(self.num_factors)
                )
                error = r - pred

                self.user_biases[u] += self.lr * (error - self.reg * self.user_biases[u])
                self.item_biases[i] += self.lr * (error - self.reg * self.item_biases[i])

                for k in range(self.num_factors):
                    uf = self.user_factors[u][k]
                    inf = self.item_factors[i][k]
                    self.user_factors[u][k] += self.lr * (error * inf - self.reg * uf)
                    self.item_factors[i][k] += self.lr * (error * uf - self.reg * inf)

    def predict(self, user_id, item_id):
        if user_id not in self.user_factors or item_id not in self.item_factors:
            return self.global_mean
        
        return self.global_mean + self.user_biases[user_id] + self.item_biases[item_id] + sum(
            self.user_factors[user_id][k] * self.item_factors[item_id][k] for k in range(self.num_factors)
        )